import { describe, expect, it } from 'vitest';
import { STATUS_LABEL } from '../../types/models';

describe('status labels are color-independent', () => {
  it('exposes readable labels for every status', () => {
    expect(STATUS_LABEL.BLOCKED).toBe('Blocked');
    expect(STATUS_LABEL.COMPLETED).toBe('Completed');
    expect(STATUS_LABEL.CRITICAL).toBeUndefined();
  });
});
