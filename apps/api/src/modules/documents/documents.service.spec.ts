import { DocumentsService } from './documents.service';
import { BadRequestException } from '@nestjs/common';

describe('DocumentsService validation', () => {
  it('rejects missing files', async () => {
    const service = new DocumentsService(
      {} as never,
      { save: jest.fn() } as never,
      { record: jest.fn() } as never,
      { emitToWork: jest.fn() } as never,
      { get: () => '10485760' } as never,
    );
    await expect(service.upload(undefined as never, { id: 'u' } as never, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
