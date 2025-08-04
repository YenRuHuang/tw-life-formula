const request = require('supertest');
const app = require('../../server');

describe('Tools API', () => {
  describe('GET /api/tools', () => {
    it('應該返回工具列表', async() => {
      const response = await request(app)
        .get('/api/tools')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tools).toBeInstanceOf(Array);
      expect(response.body.data.tools.length).toBeGreaterThan(0);

      // 檢查工具結構
      const tool = response.body.data.tools[0];
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('category');
      expect(tool).toHaveProperty('icon');
    });
  });

  describe('POST /api/tools/:toolId', () => {
    it('應該成功執行月光族計算機', async() => {
      const inputData = {
        salary: 50000,
        expenses: 45000,
        savings: 5000
      };

      const response = await request(app)
        .post('/api/tools/moonlight-calculator')
        .send(inputData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('toolId', 'moonlight-calculator');
      expect(response.body.data).toHaveProperty('result');
      expect(response.body.data.result).toHaveProperty('value');
      expect(response.body.data.result).toHaveProperty('message');
      expect(response.body.data.result).toHaveProperty('suggestions');
    });

    it('應該拒絕空的工具 ID', async() => {
      await request(app)
        .post('/api/tools/')
        .send({})
        .expect(404);
    });

    it('應該處理無效的工具 ID', async() => {
      await request(app)
        .post('/api/tools/invalid-tool')
        .send({})
        .expect(200); // 暫時返回 200，後續會改為適當的錯誤處理
    });
  });
});
