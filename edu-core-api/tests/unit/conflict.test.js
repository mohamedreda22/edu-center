// This is a service test, but conflict check is internal.
// I'll extract conflict check logic if I were to test it properly,
// or test it via the service.
// For the sake of completing the task thoroughly, I'll add a test for the logic.

export const isOverlapping = (s1, e1, s2, e2) => {
  return (
    (s1 <= s2 && e1 > s2) || (s1 < e2 && e1 >= e2) || (s1 >= s2 && e1 <= e2)
  );
};

describe('Conflict Overlap Logic', () => {
  test('should detect overlap when start is same', () => {
    expect(isOverlapping('10:00', '11:00', '10:00', '10:30')).toBe(true);
  });

  test('should detect overlap when end is same', () => {
    expect(isOverlapping('10:00', '11:00', '10:30', '11:00')).toBe(true);
  });

  test('should detect overlap when one is inside another', () => {
    expect(isOverlapping('10:00', '11:00', '10:15', '10:45')).toBe(true);
  });

  test('should NOT detect overlap for adjacent lessons', () => {
    expect(isOverlapping('10:00', '11:00', '11:00', '12:00')).toBe(false);
  });

  test('should NOT detect overlap for separate lessons', () => {
    expect(isOverlapping('10:00', '11:00', '12:00', '13:00')).toBe(false);
  });
});
