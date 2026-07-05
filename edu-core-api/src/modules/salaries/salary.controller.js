import * as salaryService from './salary.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const createSalary = asyncHandler(async (req, res) => {
  const salary = await salaryService.createSalary(req.body);
  res.status(201).json({
    success: true,
    data: salary,
  });
});

export const getAllSalaries = asyncHandler(async (req, res) => {
  const salaries = await salaryService.getAllSalaries(req.query);
  res.status(200).json({
    success: true,
    data: salaries,
  });
});

export const getSalary = asyncHandler(async (req, res) => {
  const salary = await salaryService.getSalaryById(req.params.id);
  res.status(200).json({
    success: true,
    data: salary,
  });
});

export const updateSalary = asyncHandler(async (req, res) => {
  const salary = await salaryService.updateSalary(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: salary,
  });
});

export const deleteSalary = asyncHandler(async (req, res) => {
  await salaryService.deleteSalary(req.params.id);
  res.status(204).send();
});
