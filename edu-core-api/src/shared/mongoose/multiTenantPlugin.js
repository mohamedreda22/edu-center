import mongoose from 'mongoose';

import { getTenantContext } from '../utils/tenantContext.js';

const schemaExclusions = [
  'Tenant',
  'Permission',
  'Role',
  'RefreshToken',
  'SystemSettings',
  'FeatureFlags',
  'AuditConfiguration',
  'SubscriptionPlans',
  'Countries',
  'Currencies',
  'Migration',
  'LookupTable',
];

const isExcluded = (modelName) => {
  return modelName && schemaExclusions.includes(modelName);
};

export const multiTenantPlugin = (schema) => {
  // Add tenantId and branchId if they don't already exist
  if (!schema.path('tenantId')) {
    schema.add({
      tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: false,
        index: true,
      },
    });
  }

  if (!schema.path('branchId')) {
    schema.add({
      branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false,
        index: true,
      },
    });
  }

  // Soft Delete Support Fields
  if (!schema.path('deletedAt')) {
    schema.add({
      deletedAt: {
        type: Date,
        default: null,
        index: true,
      },
    });
  }

  if (!schema.path('isDeleted')) {
    schema.add({
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
    });
  }

  if (!schema.path('deletedBy')) {
    schema.add({
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    });
  }

  // Query helpers to easily apply tenant and branch filters
  schema.query.byTenant = function (tenantId) {
    if (!tenantId) {
      return this;
    }
    return this.where({ tenantId });
  };

  schema.query.byBranch = function (branchId) {
    if (!branchId) {
      return this;
    }
    return this.where({ branchId });
  };

  schema.query.byTenantAndBranch = function (tenantId, branchId) {
    let query = this;
    if (tenantId) {
      query = query.where({ tenantId });
    }
    if (branchId) {
      query = query.where({ branchId });
    }
    return query;
  };

  // Override / bypass tenant scope
  schema.query.ignoreTenant = function () {
    return this.setOptions({ bypassTenant: true });
  };

  schema.query.withoutTenantScope = function () {
    return this.setOptions({ bypassTenant: true });
  };

  // Hook into query operations
  const queryHooks = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'updateMany',
    'updateOne',
    'deleteMany',
    'deleteOne',
    'countDocuments',
    'distinct',
  ];

  queryHooks.forEach((hookType) => {
    schema.pre(hookType, function (next) {
      const options = this.getOptions();
      const modelName = this.model?.modelName;

      if (isExcluded(modelName)) {
        next();
        return;
      }

      // 1. Soft Delete Filter
      if (!options || !options.withDeleted) {
        this.where({ deletedAt: null });
      }

      // 2. Tenant Isolation
      if (!options || !options.bypassTenant) {
        const context = getTenantContext();
        if (context && context.tenantId) {
          this.where({ tenantId: context.tenantId });
        }
      }

      next();
    });
  });

  // Hook into aggregates
  schema.pre('aggregate', function (next) {
    const options = this.options || {};
    const modelName = this.model()?.modelName;

    if (isExcluded(modelName)) {
      next();
      return;
    }

    const pipeline = this.pipeline();

    // 1. Soft Delete Filter Stage
    if (!options.withDeleted) {
      pipeline.unshift({ $match: { deletedAt: null } });
    }

    // 2. Tenant Isolation Stage
    if (!options.bypassTenant) {
      const context = getTenantContext();
      if (context && context.tenantId) {
        pipeline.unshift({
          $match: { tenantId: new mongoose.Types.ObjectId(context.tenantId) },
        });
      }
    }

    next();
  });

  // Post-save hook to handle document-level cascading soft deletions
  schema.post('save', async function (doc, next) {
    const modelName = doc.constructor?.modelName;
    if (isExcluded(modelName)) {
      if (next) {
        next();
      }
      return;
    }

    if (doc.isDeleted && doc.deletedAt) {
      try {
        const { CascadeDeleteService } =
          await import('../services/cascadeDelete.service.js');
        await CascadeDeleteService.cascadeSoftDelete(modelName, doc._id, {
          deletedAt: doc.deletedAt,
          isDeleted: doc.isDeleted,
          deletedBy: doc.deletedBy,
        });
      } catch (err) {
        import('../services/logger.js').then((m) =>
          m.default.error(
            `[multiTenantPlugin] Post-save cascade failed: ${err.message}`
          )
        );
      }
    }
    if (next) {
      next();
    }
  });

  // Pre-update hooks to intercept query-level soft deletions (updateOne, updateMany, findOneAndUpdate)
  const updateHooks = ['updateOne', 'updateMany', 'findOneAndUpdate'];
  updateHooks.forEach((hookType) => {
    schema.pre(hookType, async function (next) {
      const modelName = this.model?.modelName;
      if (isExcluded(modelName)) {
        next();
        return;
      }

      const update = this.getUpdate();
      const $set = update?.$set || update;

      if ($set && ($set.deletedAt || $set.isDeleted)) {
        try {
          // Find matching records before they get modified to extract their IDs
          const docs = await this.model
            .find(this.getQuery())
            .session(this.options?.session);
          const { CascadeDeleteService } =
            await import('../services/cascadeDelete.service.js');

          for (const doc of docs) {
            await CascadeDeleteService.cascadeSoftDelete(
              modelName,
              doc._id,
              {
                deletedAt: $set.deletedAt || new Date(),
                isDeleted: $set.isDeleted ?? true,
                deletedBy: $set.deletedBy || null,
              },
              this.options?.session
            );
          }
        } catch (err) {
          import('../services/logger.js').then((m) =>
            m.default.error(
              `[multiTenantPlugin] Pre-update cascade failed: ${err.message}`
            )
          );
        }
      }
      next();
    });
  });

  // Hook into document creation (save)
  schema.pre('save', function (next) {
    const modelName = this.constructor?.modelName;
    if (isExcluded(modelName)) {
      next();
      return;
    }

    const context = getTenantContext();
    if (context && context.tenantId && !this.tenantId) {
      this.tenantId = context.tenantId;
    }

    // Set isDeleted on save if deletedAt is present
    if (this.deletedAt && !this.isDeleted) {
      this.isDeleted = true;
    }

    next();
  });

  // Hook into bulk inserts
  schema.pre('insertMany', function (next, docs) {
    const modelName = this.modelName;
    if (isExcluded(modelName)) {
      next();
      return;
    }

    const context = getTenantContext();
    if (context && context.tenantId) {
      if (Array.isArray(docs)) {
        docs.forEach((doc) => {
          if (!doc.tenantId) {
            doc.tenantId = context.tenantId;
          }
          if (doc.deletedAt && !doc.isDeleted) {
            doc.isDeleted = true;
          }
        });
      }
    }
    next();
  });
};
