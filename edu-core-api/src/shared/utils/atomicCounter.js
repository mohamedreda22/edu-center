import Counter from '../../modules/students/counter.model.js';

/**
 * Get the next sequence value for a counter
 * @param {string} id - The counter ID (e.g., 'studentCode')
 * @returns {Promise<number>}
 */
export const getNextSequenceValue = async (id) => {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    id,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
};

/**
 * Generate a formatted code (e.g., STD0001)
 * @param {string} id
 * @param {string} prefix
 * @param {number} padding
 * @returns {Promise<string>}
 */
export const generateCode = async (id, prefix, padding = 4) => {
  const seq = await getNextSequenceValue(id);
  return `${prefix}${seq.toString().padStart(padding, '0')}`;
};
