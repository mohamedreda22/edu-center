import Lesson from './lesson.model.js';

export const findById = async (id, session = null) => {
  return Lesson.findById(id).session(session);
};

export const find = async (filter, session = null) => {
  return Lesson.find(filter).session(session);
};

export const findOne = async (filter, session = null) => {
  return Lesson.findOne(filter).session(session);
};

export const create = async (data, session = null) => {
  return Lesson.create([data], { session });
};

export const updateById = async (id, update, session = null) => {
  return Lesson.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    session,
  });
};
