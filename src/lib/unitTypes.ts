import { UnitTypeDefinition, MinionRarity } from './types';

export const UNIT_DEFINITIONS: Record<string, UnitTypeDefinition> = {
  fact_checker: {
    typeId: 'fact_checker',
    name: 'Chiến Binh Fact-Check',
    rarity: 'common',
    description: 'Robot trang bị kính lúp laser xanh lá, bắn tia giải mã sự thật liên tục làm suy yếu Boss.',
    icon: '🤖',
    color: '#06d6a0',
    glowColor: 'rgba(6, 214, 160, 0.6)',
    baseHp: 1500,
    baseDamage: 2500,
    speed: 2.2,
    attackSpeed: 1000,
    ability: 'Tia Sự Thật: Giảm 5% giáp Boss'
  },
  firewall_guard: {
    typeId: 'firewall_guard',
    name: 'Hộ Vệ Tường Lửa 2FA',
    rarity: 'common',
    description: 'Hiệp sĩ mang khiên năng lượng số, xông lên tuyến đầu che chắn các đòn quét laser của Boss.',
    icon: '🛡️',
    color: '#118ab2',
    glowColor: 'rgba(17, 138, 178, 0.6)',
    baseHp: 5000,
    baseDamage: 1200,
    speed: 1.5,
    attackSpeed: 1200,
    ability: 'Khiên Bảo Vệ: Hấp thụ đòn quét diện rộng của Boss'
  },
  enlighten_drone: {
    typeId: 'enlighten_drone',
    name: 'Drone Tuyên Truyền Khai Sáng',
    rarity: 'rare',
    description: 'Máy bay không người lái mang loa phát thanh số và cờ đỏ hologram, bay trên không buff đồng minh.',
    icon: '🛸',
    color: '#ffd166',
    glowColor: 'rgba(255, 209, 102, 0.7)',
    baseHp: 2000,
    baseDamage: 3800,
    speed: 3.0,
    attackSpeed: 900,
    ability: 'Khí Thế Cách Mạng: Tăng 35% tốc độ đánh cho lính xung quanh'
  },
  cyber_lawyer: {
    typeId: 'cyber_lawyer',
    name: 'Pháp Sư Luật An Ninh Mạng',
    rarity: 'epic',
    description: 'Nắm giữ quyền trượng Cán Cân Công Lý số, gọi thiên lôi pháp quyền giáng thẳng vào đầu Boss.',
    icon: '⚡',
    color: '#7209b7',
    glowColor: 'rgba(114, 9, 183, 0.7)',
    baseHp: 3000,
    baseDamage: 9500,
    speed: 1.8,
    attackSpeed: 1500,
    ability: 'Sấm Sét Pháp Quyền: Làm Boss bị choáng (Slow 40%)'
  },
  digital_tank: {
    typeId: 'digital_tank',
    name: 'Xe Tăng Chuyển Đổi Số',
    rarity: 'epic',
    description: 'Thiết giáp hạm mang trạm phát 5G & logo Dịch Vụ Công, nã đạn Big Data càn quét dữ dội.',
    icon: '🚜',
    color: '#ef233c',
    glowColor: 'rgba(239, 35, 60, 0.7)',
    baseHp: 8000,
    baseDamage: 14000,
    speed: 1.2,
    attackSpeed: 2000,
    ability: 'Đại Pháo Big Data: Xuyên thủng phân thân của Boss'
  },
  consensus_dragon: {
    typeId: 'consensus_dragon',
    name: 'RỒNG THẦN ĐỒNG THUẬN QUỐC GIA',
    rarity: 'legendary',
    description: 'Rồng số khổng lồ phát sáng hoàng kim đại diện cho Đại đoàn kết dân tộc trên không gian mạng!',
    icon: '🐉',
    color: '#ffb703',
    glowColor: 'rgba(255, 183, 3, 0.9)',
    baseHp: 20000,
    baseDamage: 35000,
    speed: 3.5,
    attackSpeed: 1200,
    ability: 'Ngọn Lửa Dân Chủ Chân Chính: Nổ 50,000 HP diện rộng!'
  }
};

export function getRandomUnitType(isCrit: boolean, streak: number): UnitTypeDefinition {
  const rand = Math.random() * 100;
  
  // If CRIT (<3s) or high streak, significantly increase Epic & Legendary chances
  if (isCrit || streak >= 3) {
    if (rand < 20) return UNIT_DEFINITIONS.consensus_dragon;
    if (rand < 55) return UNIT_DEFINITIONS.digital_tank;
    if (rand < 85) return UNIT_DEFINITIONS.cyber_lawyer;
    return UNIT_DEFINITIONS.enlighten_drone;
  }

  // Normal drop rates
  if (rand < 4) return UNIT_DEFINITIONS.consensus_dragon;     // 4%
  if (rand < 18) return UNIT_DEFINITIONS.digital_tank;        // 14%
  if (rand < 36) return UNIT_DEFINITIONS.cyber_lawyer;        // 18%
  if (rand < 62) return UNIT_DEFINITIONS.enlighten_drone;     // 26%
  if (rand < 82) return UNIT_DEFINITIONS.firewall_guard;      // 20%
  return UNIT_DEFINITIONS.fact_checker;                       // 18%
}
