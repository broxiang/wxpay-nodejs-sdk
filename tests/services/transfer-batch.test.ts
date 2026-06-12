import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferBatchService } from '../../src/services/transfer-batch';
import { PartnerTransferBatchService } from '../../src/services/partner-transfer-batch';
import { WxPayClient } from '../../src/core/client';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

function createMockClient() {
  return {
    post: vi.fn(),
    get: vi.fn(),
    downloadRaw: vi.fn(),
    mchid: '1900000100',
  };
}

// ============= TransferBatchService =============

describe('TransferBatchService', () => {
  let service: TransferBatchService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new TransferBatchService(mockClient as unknown as WxPayClient);
  });

  it('should initiate batch transfer', async () => {
    const request = {
      appid: 'wx8888888888888888',
      out_batch_no: 'BATCH20240115001',
      batch_name: '测试批次',
      batch_remark: '测试转账',
      total_amount: 200,
      total_num: 2,
      transfer_detail_list: [
        {
          out_detail_no: 'D001',
          transfer_amount: 100,
          transfer_remark: '转账1',
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        },
        {
          out_detail_no: 'D002',
          transfer_amount: 100,
          transfer_remark: '转账2',
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o2',
        },
      ],
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        out_batch_no: 'BATCH20240115001',
        batch_id: '1330000071100999991182020050700019480001',
        create_time: '2024-01-15T10:00:00+08:00',
        batch_status: 'ACCEPTED',
      },
    });

    const result = await service.initiateBatchTransfer(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/transfer/batches', request);
    expect(result.data.batch_status).toBe('ACCEPTED');
  });

  it('should get transfer batch by batch id', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        transfer_batch: {
          batch_id: '1330000071100999991182020050700019480001',
          batch_status: 'FINISHED',
        },
      },
    });

    const result = await service.getTransferBatchByNo('1330000071100999991182020050700019480001');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/transfer/batches/batch-id/1330000071100999991182020050700019480001',
      undefined,
    );
    expect(result.data.transfer_batch.batch_status).toBe('FINISHED');
  });

  it('should get transfer batch by batch id with params', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        transfer_batch: { batch_status: 'FINISHED' },
        transfer_detail_list: [{ detail_id: 'D1', detail_status: 'SUCCESS' }],
      },
    });

    await service.getTransferBatchByNo('BATCH_ID', {
      need_query_detail: true,
      offset: 0,
      limit: 20,
      detail_status: 'SUCCESS',
    });
    expect(mockClient.get).toHaveBeenCalledWith('/v3/transfer/batches/batch-id/BATCH_ID', {
      need_query_detail: true,
      offset: 0,
      limit: 20,
      detail_status: 'SUCCESS',
    });
  });

  it('should get transfer batch by out batch no', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { transfer_batch: { out_batch_no: 'BATCH20240115001', batch_status: 'PROCESSING' } },
    });

    const result = await service.getTransferBatchByOutNo('BATCH20240115001');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/transfer/batches/out-batch-no/BATCH20240115001',
      undefined,
    );
    expect(result.data.transfer_batch.batch_status).toBe('PROCESSING');
  });

  it('should get transfer detail by detail id', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        detail_id: '1330000071100999991182020050700019480002',
        detail_status: 'SUCCESS',
        transfer_amount: 100,
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
      },
    });

    const result = await service.getTransferDetailByNo('BATCH_ID', 'DETAIL_ID');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/transfer/batches/batch-id/BATCH_ID/details/detail-id/DETAIL_ID',
    );
    expect(result.data.detail_status).toBe('SUCCESS');
  });

  it('should get transfer detail by out detail no', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { out_detail_no: 'D001', detail_status: 'SUCCESS', transfer_amount: 100 },
    });

    const result = await service.getTransferDetailByOutNo('BATCH20240115001', 'D001');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/transfer/batches/out-batch-no/BATCH20240115001/details/out-detail-no/D001',
    );
    expect(result.data.detail_status).toBe('SUCCESS');
  });
});

// ============= PartnerTransferBatchService =============

describe('PartnerTransferBatchService', () => {
  let service: PartnerTransferBatchService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PartnerTransferBatchService(mockClient as unknown as WxPayClient);
  });

  it('should initiate partner batch transfer', async () => {
    const request = {
      appid: 'wx8888888888888888',
      out_batch_no: 'PBATCH20240115001',
      batch_name: '服务商测试批次',
      batch_remark: '测试转账',
      total_amount: 200,
      total_num: 2,
      transfer_detail_list: [
        {
          out_detail_no: 'PD001',
          transfer_amount: 100,
          transfer_remark: '转账1',
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        },
        {
          out_detail_no: 'PD002',
          transfer_amount: 100,
          transfer_remark: '转账2',
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o2',
        },
      ],
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        out_batch_no: 'PBATCH20240115001',
        batch_id: '1330000071100999991182020050700019480003',
        create_time: '2024-01-15T10:00:00+08:00',
        batch_status: 'ACCEPTED',
      },
    });

    const result = await service.initiateBatchTransfer(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/partner-transfer/batches', request);
    expect(result.data.batch_status).toBe('ACCEPTED');
  });

  it('should get partner transfer batch by batch id', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { transfer_batch: { batch_id: 'BATCH_ID', batch_status: 'FINISHED' } },
    });

    const result = await service.getTransferBatchByNo('BATCH_ID');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/partner-transfer/batches/batch-id/BATCH_ID',
      undefined,
    );
    expect(result.data.transfer_batch.batch_status).toBe('FINISHED');
  });

  it('should get partner transfer batch by batch id with params', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { transfer_batch: { batch_status: 'FINISHED' }, transfer_detail_list: [] },
    });

    await service.getTransferBatchByNo('BATCH_ID', {
      need_query_detail: true,
      offset: 0,
      limit: 50,
      detail_status: 'ALL',
    });
    expect(mockClient.get).toHaveBeenCalledWith('/v3/partner-transfer/batches/batch-id/BATCH_ID', {
      need_query_detail: true,
      offset: 0,
      limit: 50,
      detail_status: 'ALL',
    });
  });

  it('should get partner transfer batch by out batch no', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { transfer_batch: { out_batch_no: 'PBATCH20240115001', batch_status: 'PROCESSING' } },
    });

    const result = await service.getTransferBatchByOutNo('PBATCH20240115001');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/partner-transfer/batches/out-batch-no/PBATCH20240115001',
      undefined,
    );
    expect(result.data.transfer_batch.batch_status).toBe('PROCESSING');
  });

  it('should get partner transfer detail by detail id', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        detail_id: 'DETAIL_ID',
        detail_status: 'SUCCESS',
        transfer_amount: 100,
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
      },
    });

    const result = await service.getTransferDetailByNo('BATCH_ID', 'DETAIL_ID');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/partner-transfer/batches/batch-id/BATCH_ID/details/detail-id/DETAIL_ID',
    );
    expect(result.data.detail_status).toBe('SUCCESS');
  });

  it('should get partner transfer detail by out detail no', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { out_detail_no: 'PD001', detail_status: 'SUCCESS', transfer_amount: 100 },
    });

    const result = await service.getTransferDetailByOutNo('PBATCH20240115001', 'PD001');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/partner-transfer/batches/out-batch-no/PBATCH20240115001/details/out-detail-no/PD001',
    );
    expect(result.data.detail_status).toBe('SUCCESS');
  });
});
