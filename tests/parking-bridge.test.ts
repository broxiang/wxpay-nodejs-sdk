import { describe, it, expect } from 'vitest';
import {
  buildParkingMiniProgramBridgeConfig,
  buildParkingH5BridgeUrl,
  buildParkingAppBridgePath,
  buildParkingRepayBridgeConfig,
} from '../src/services/bridge.js';

describe('Parking Bridge Configs', () => {
  const mchid = '1230000109';
  const openid = 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o';
  const plateNumber = '粤B888888';
  const plateColor = 'BLUE' as const;

  describe('buildParkingMiniProgramBridgeConfig', () => {
    it('should return correct mini program config', () => {
      const config = buildParkingMiniProgramBridgeConfig(mchid, openid, plateNumber, plateColor);

      expect(config.appId).toBe('wxbcad394b3d99dac9');
      expect(config.path).toBe('/pages/auth-creditpay/auth-creditpay');
      expect(config.extraData.mchid).toBe(mchid);
      expect(config.extraData.openid).toBe(openid);
      expect(config.extraData.plate_number).toBe(plateNumber);
      expect(config.extraData.plate_color).toBe('BLUE');
      expect(config.extraData.trade_scene).toBe('PARKING');
    });

    it('should support different plate colors', () => {
      const config = buildParkingMiniProgramBridgeConfig(mchid, openid, '粤B999999', 'GREEN');

      expect(config.extraData.plate_color).toBe('GREEN');
      expect(config.extraData.plate_number).toBe('粤B999999');
    });
  });

  describe('buildParkingH5BridgeUrl', () => {
    it('should return correct H5 bridge URL path', () => {
      const url = buildParkingH5BridgeUrl(mchid, openid, plateNumber, plateColor);

      expect(url).toContain('/pages/auth-creditpay/auth-creditpay?');
      expect(url).toContain(`mchid=${mchid}`);
      expect(url).toContain(`openid=${openid}`);
      expect(url).toContain(`plate_number=${encodeURIComponent(plateNumber)}`);
      expect(url).toContain('plate_color=BLUE');
      expect(url).toContain('trade_scene=PARKING');
    });

    it('should properly encode special characters in plate number', () => {
      const url = buildParkingH5BridgeUrl(mchid, openid, '京A·12345', 'YELLOW');

      expect(url).toContain(`plate_number=${encodeURIComponent('京A·12345')}`);
      expect(url).toContain('plate_color=YELLOW');
    });
  });

  describe('buildParkingAppBridgePath', () => {
    it('should return correct App bridge path', () => {
      const path = buildParkingAppBridgePath(mchid, openid, plateNumber, plateColor);

      expect(path).toContain('/pages/auth-creditpay/auth-creditpay?');
      expect(path).toContain(`mchid=${mchid}`);
      expect(path).toContain(`openid=${openid}`);
      expect(path).toContain(`plate_number=${encodeURIComponent(plateNumber)}`);
      expect(path).toContain('plate_color=BLUE');
      expect(path).toContain('trade_scene=PARKING');
    });
  });

  describe('buildParkingRepayBridgeConfig', () => {
    it('should return correct repay config with openid', () => {
      const config = buildParkingRepayBridgeConfig(mchid, openid);

      expect(config.appId).toBe('wx5e73c65404eee268');
      expect(config.path).toBe('pages/invest_list/invest_list');
      expect(config.extraData.mchid).toBe(mchid);
      expect(config.extraData.openid).toBe(openid);
      expect(config.extraData.nonce_str).toBeDefined();
      expect(config.extraData.nonce_str.length).toBe(32);
    });

    it('should return correct repay config without openid', () => {
      const config = buildParkingRepayBridgeConfig(mchid);

      expect(config.appId).toBe('wx5e73c65404eee268');
      expect(config.path).toBe('pages/invest_list/invest_list');
      expect(config.extraData.mchid).toBe(mchid);
      expect(config.extraData.openid).toBeUndefined();
      expect(config.extraData.nonce_str).toBeDefined();
      expect(config.extraData.nonce_str.length).toBe(32);
    });

    it('should generate unique nonce_str on each call', () => {
      const config1 = buildParkingRepayBridgeConfig(mchid);
      const config2 = buildParkingRepayBridgeConfig(mchid);

      expect(config1.extraData.nonce_str).not.toBe(config2.extraData.nonce_str);
    });
  });
});
