// tests/fixtures/mockData.mjs

export const MOCK_AVATARS = [
  { id: 'keyboard_warrior', name: 'Anh Hùng Bàn Phím', title: 'Chiến Thần Gõ Phím', color: '#EF233C', icon: '⌨️' },
  { id: 'grammar_police', name: 'Cảnh Sát Chính Tả', title: 'Soi Từng Dấu Phẩy', color: '#06D6A0', icon: '🔍' },
  { id: 'var_inspector', name: 'Thanh Tra Check VAR', title: 'Kính Lúp Công Lý', color: '#118AB2', icon: '🔎' },
  { id: 'anti_scam_otter', name: 'Rái Cá Chống Lừa Đảo', title: 'Tỉnh Táo Nhất Xóm', color: '#FFD166', icon: '🦦' },
  { id: 'zen_monk', name: 'Sư Phụ Tu Tâm', title: 'Tâm Bất Biến', color: '#7209B7', icon: '🧘' },
  { id: 'chicken_feeder', name: 'Seeder Lùa Gà', title: 'Chuyên Gia Thổi Giá', color: '#F72585', icon: '🐔' },
  { id: 'phd_student', name: 'Học Giả Bách Khoa', title: 'Luận Văn 300 Trang', color: '#3A0CA3', icon: '☕' },
  { id: 'genz_slang_queen', name: 'Chiến Thần Tóp Tóp', title: 'Nữ Hoàng Xu Hướng', color: '#4CC9F0', icon: '🧋' },
  { id: 'conspiracy_theorist', name: 'Thánh Thuyết Âm Mưu', title: 'Mọi Thứ Đều Được Sắp Đặt', color: '#4361EE', icon: '🛸' },
  { id: 'righteous_netizen', name: 'Dân Mạng Lương Thiện', title: 'Ngọn Hải Đăng Công Lý', color: '#FFB703', icon: '✨' },
];

export const MOCK_R1_PROMPTS = [
  {
    id: 'r1_p1',
    prompt: "Khi một 'chuyên gia tài chính' trên mạng hứa hẹn lãi suất 100%/tháng, bạn sẽ phản biện câu gì cay nhất?",
    category: "Chống Lừa Đảo Số"
  },
  {
    id: 'r1_p2',
    prompt: "Bác tổ trưởng gửi nhầm tin nhắn gì vào nhóm Zalo tổ dân phố khiến cả xóm đứng hình mất 5 giây?",
    category: "Dân Biết Dân Bàn"
  },
  {
    id: 'r1_p3',
    prompt: "Một 'chiến thần livestream' khóc lóc thanh minh sau khi bị Cảnh sát An ninh mạng sờ gáy vì tung tin thất thiệt, bạn bình luận gì?",
    category: "Kỷ Cương Pháp Quyền"
  }
];

export const MOCK_R2_MINIGAMES = [
  {
    id: 'catch_report',
    title: 'Tóm Nút Báo Cáo',
    instruction: 'Nút Report đang chạy trốn! Nhấp chuẩn xác trước khi scammer biến mất!',
    durationMs: 5000,
    type: 'CATCH_REPORT'
  },
  {
    id: 'shake_otp',
    title: 'Lắc Điện Thoại Lấy OTP',
    instruction: 'Lắc điện thoại hoặc gõ liên tục 15 lần để kích hoạt mã bảo mật cấp 2!',
    durationMs: 5000,
    type: 'SHAKE_OTP'
  },
  {
    id: 'dodge_bricks',
    title: 'Né Gạch Đá Toxic',
    instruction: 'Dùng ngón tay né các bình luận gạch đá drama đang rơi như mưa!',
    durationMs: 5000,
    type: 'DODGE_BRICKS'
  },
  {
    id: 'spot_deepfake',
    title: 'Soi Lỗi Deepfake',
    instruction: 'Tìm và chạm đúng điểm ảnh glitch bất thường trên khuôn mặt AI lừa đảo!',
    durationMs: 5000,
    type: 'SPOT_DEEPFAKE'
  }
];

export const MOCK_R3_CLUES = [
  {
    id: 'clue_1',
    text: "Tài khoản @seeder_king đăng cùng lúc 12 bài viết giống hệt nhau chỉ trong 3 giây.",
    targetRole: 'SEEDER'
  },
  {
    id: 'clue_2',
    text: "Tài khoản @netizen_minh thường xuyên tra cứu Cổng Dịch Vụ Công Quốc Gia để kiểm chứng thông tin.",
    targetRole: 'NETIZEN'
  },
  {
    id: 'clue_3',
    text: "IP của một tài khoản lạ trùng khớp với mạng botnet bị Bộ Công An cảnh báo.",
    targetRole: 'SEEDER'
  }
];

export const MOCK_SABOTAGE_CARDS = [
  {
    id: 'CARD_INK',
    name: 'Đổ Mực Màn Hình',
    description: 'Bắn vết mực loang che phủ màn hình đối thủ, buộc họ phải vuốt 7 lần để lau sạch.',
    cost: 0
  },
  {
    id: 'CARD_HEIST',
    name: 'Cướp 50% Điểm',
    description: 'Hút 50% số điểm hiện tại của người chơi mục tiêu.',
    cost: 0
  },
  {
    id: 'CARD_TROLL',
    name: 'Bẻ Lái Câu Hỏi',
    description: 'Xáo trộn thứ tự các đáp án trắc nghiệm của mục tiêu.',
    cost: 0
  },
  {
    id: 'CARD_BET_2X',
    name: 'Cược Niềm Tin x2',
    description: 'Nhân đôi số điểm kiếm được ở câu tiếp theo nếu trả lời đúng, trừ gấp đôi nếu sai.',
    cost: 0
  },
  {
    id: 'CARD_SHIELD',
    name: 'Khiên An Toàn Số',
    description: 'Miễn nhiễm hoàn toàn với mọi hiệu ứng chơi xấu từ người khác trong 1 lượt.',
    cost: 0
  }
];

export const DEV_BOT_NAMES = [
  "Nguyễn Văn An (K65)",
  "Trần Thị Mai (K66)",
  "Lê Hoàng Long",
  "Phạm Bích Ngọc",
  "Đỗ Minh Triết",
  "Vũ Hải Đăng",
  "Hoàng Thục Quyên",
  "Bùi Gia Bảo",
  "Ngô Tấn Tài",
  "Dương Cẩm Tú",
  "Đinh Trọng Nghĩa",
  "Lý Gia Hân",
  "Hà Quang Khải",
  "Võ Nhật Nam",
  "Trịnh Phương Linh",
  "Phan Thanh Bình",
  "Đoàn Thế Anh",
  "Mai Diệu Huyền"
];
