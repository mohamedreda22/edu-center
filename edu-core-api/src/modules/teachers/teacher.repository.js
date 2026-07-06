import Teacher from './teacher.model.js';

export const findById = async (id, session = null) => {
  return Teacher.findById(id).session(session);
};

export const findOne = async (filter, session = null) => {
  return Teacher.findOne(filter).session(session);
};

export const create = async (data, session = null) => {
  return Teacher.create([data], { session });
};

export const find = async (filter, options = {}) => {
  const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
  return Teacher.find(filter).sort(sort).skip(skip).limit(limit);
};

export const countDocuments = async (filter) => {
  return Teacher.countDocuments(filter);
};

export const findByIdAndUpdate = async (id, update, options = {}) => {
  return Teacher.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    ...options,
  });
};
