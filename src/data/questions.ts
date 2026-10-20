import { QuizQuestion, RoastPrompt, FactCapQuestion, DilemmaItem } from '../lib/types';

export const MLN131_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    topic: "Dân Biết Số",
    scenario: "Một tài khoản TikTok ẩn danh đăng tin: 'Nước ta sắp đổi tiền giấy sang tiền ảo trong tuần tới'. Là một công dân có ý thức làm chủ trên không gian số, bạn nên làm gì đầu tiên?",
    options: [
      "Chia sẻ ngay vào nhóm lớp và gia đình để mọi người đi rút tiền",
      "Tra cứu Cổng Thông Tin Điện Tử Chính Phủ & Ngân hàng Nhà nước để xác thực",
      "Kêu gọi bạn bè bình luận công kích tài khoản TikTok đó",
      "Tin ngay vì video có tới hơn 1 triệu lượt xem và nhiều bình luận"
    ],
    correctAnswer: 1,
    explanation: "'Dân biết' trên không gian số đòi hỏi công dân phải tiếp cận và kiểm chứng thông tin từ các kênh truyền thông chính thống của Nhà nước, không lan truyền tin giả."
  },
  {
    id: 2,
    topic: "Dân Bàn Số",
    scenario: "Bộ Công An công bố dự thảo luật mới trên Cổng thông tin điện tử để lấy ý kiến nhân dân. Hành vi nào thể hiện đúng bản chất của 'Dân bàn' trong nền dân chủ XHCN?",
    options: [
      "Chửi bới bất mãn trên các diễn đàn mạng không chính thống",
      "Gửi ý kiến đóng góp xây dựng, khoa học qua Cổng tham vấn trực tuyến",
      "Không quan tâm vì nghĩ việc làm luật chỉ là của cơ quan nhà nước",
      "Copy bình luận kích động của người khác rồi spam khắp các bài viết"
    ],
    correctAnswer: 1,
    explanation: "'Dân bàn' là quyền và trách nhiệm của nhân dân trong việc trực tiếp tham gia thảo luận, đóng góp ý kiến xây dựng chính sách pháp luật thông qua các kênh số chính danh."
  },
  {
    id: 3,
    topic: "Dân Kiểm Tra & Giám Sát Số",
    scenario: "Người dân phát hiện một công trình đường giao thông nông thôn bị bớt xén vật liệu. Nền tảng số nào sau đây hỗ trợ nhân dân thực hiện quyền 'Dân giám sát' văn minh, đúng pháp luật nhất?",
    options: [
      "Quay video đăng đàn bóc phốt câu like trên mạng xã hội cá nhân",
      "Gửi phản ánh kèm hình ảnh/tọa độ qua ứng dụng Đô thị thông minh (như Hue-S, VNeID, Cổng dịch vụ công)",
      "Tập hợp đám đông đến nhà cán bộ gây rối trật tự",
      "Âm thầm bỏ qua vì nghĩ tiếng nói của mình không ai lắng nghe"
    ],
    correctAnswer: 1,
    explanation: "Phát huy dân chủ số là sử dụng các ứng dụng phản ánh hiện trường chính thống để cơ quan có thẩm quyền tiếp nhận, xử lý minh bạch và có phản hồi chính thức."
  },
  {
    id: 4,
    topic: "Pháp Quyền & Kỷ Cương Số",
    scenario: "Có quan điểm cho rằng: 'Dân chủ trên mạng là tôi có quyền nói bất cứ điều gì, chửi bới ai tùy thích vì đây là quyền tự do ngôn luận'. Quan điểm này sai lầm ở điểm nào theo MLN131?",
    options: [
      "Dân chủ XHCN luôn gắn liền với Kỷ cương và Pháp luật (Luật An ninh mạng)",
      "Trên mạng xã hội không có luật pháp nào can thiệp được",
      "Chỉ những người nổi tiếng mới cần tuân thủ pháp luật",
      "Dân chủ tư sản mới cho phép chửi bới tự do"
    ],
    correctAnswer: 0,
    explanation: "Dân chủ XHCN không phải là tự do vô chính phủ. Dân chủ phải đi đôi với kỷ cương, pháp luật; tự do của người này không được xâm phạm danh dự, quyền lợi của người khác và cộng đồng."
  },
  {
    id: 5,
    topic: "Dân Thụ Hưởng Số",
    scenario: "Việc triển khai Cổng Dịch vụ công Quốc gia và Đề án 06 (VNeID) giúp người dân làm giấy tờ khai sinh, cấp hộ chiếu online tại nhà thể hiện chữ DÂN nào rõ nét nhất?",
    options: [
      "Dân biết",
      "Dân bàn",
      "Dân thụ hưởng",
      "Dân kiểm tra"
    ],
    correctAnswer: 2,
    explanation: "'Dân thụ hưởng' là mục tiêu tối thượng của nền dân chủ XHCN: mọi thành quả của công cuộc chuyển đổi số quốc gia đều phải phục vụ đời sống tiện ích, ấm no, bình đẳng của nhân dân."
  },
  {
    id: 6,
    topic: "Chống Dân Túy Mạng",
    scenario: "Một số đối tượng trên mạng thường dùng luận điệu 'dân túy mạng' (hứa hẹn những điều viển vông, kích động chia rẽ vùng miền, phủ nhận thành tựu phát triển). Bản chất của chiêu trò này là gì?",
    options: [
      "Thực sự vì quyền lợi của nhân dân lao động",
      "Lợi dụng vỏ bọc 'vì dân' để thao túng dư luận, phá hoại khối đại đoàn kết toàn dân tộc",
      "Một hình thức phát triển dân chủ tiến bộ kiểu mới",
      "Giúp nhân dân nhận thức rõ hơn về kinh tế thị trường"
    ],
    correctAnswer: 1,
    explanation: "Căn bệnh 'dân túy mạng' lợi dụng cảm xúc đám đông để chống phá nền dân chủ chân chính, làm xói mòn niềm tin và chia rẽ khối liên minh giai cấp."
  },
  {
    id: 7,
    topic: "Dân Làm Số",
    scenario: "Sinh viên tham gia 'Tổ công nghệ số cộng đồng' hướng dẫn bà con nông dân tạo tài khoản dịch vụ công và bán nông sản trên sàn thương mại điện tử là biểu hiện của:",
    options: [
      "Dân biết và Dân bàn",
      "Dân làm - Trực tiếp tham gia kiến tạo xã hội số và phát triển kinh tế số",
      "Hoạt động mang tính hình thức không mang lại giá trị",
      "Chỉ là trách nhiệm riêng của các kỹ sư IT"
    ],
    correctAnswer: 1,
    explanation: "'Dân làm' trong thời đại số là nhân dân trực tiếp tham gia vào các phong trào chuyển đổi số quốc gia, biến chủ trương thành hành động thực tiễn."
  },
  {
    id: 8,
    topic: "Khối Liên Minh Trên Không Gian Số",
    scenario: "Trong thời đại 4.0, sự liên minh giữa Công nhân công nghệ (IT), Nông dân làm nông nghiệp số và Trí thức nghiên cứu AI phản ánh nội dung nào trong MLN131?",
    options: [
      "Sự tan rã của giai cấp công nhân",
      "Cơ cấu xã hội - giai cấp và liên minh giai cấp, tầng lớp trong thời kỳ quá độ",
      "Sự mất đi vai trò của nhà nước",
      "Sự thay thế hoàn toàn con người bằng máy móc"
    ],
    correctAnswer: 1,
    explanation: "Khối liên minh Công - Nông - Trí thức ngày nay được nâng cấp trên nền tảng kinh tế số, gắn kết chặt chẽ qua chuỗi giá trị công nghệ cao."
  },
  {
    id: 9,
    topic: "Bản Chất Dân Chủ XHCN",
    scenario: "Khác biệt căn bản giữa việc lấy ý kiến cử tri trên mạng trong nền dân chủ XHCN so với việc 'bầu cử bằng tiền quyên góp' trong một số nền dân chủ tư sản là gì?",
    options: [
      "Dân chủ XHCN coi trọng tiếng nói bình đẳng thực chất của mọi tầng lớp nhân dân lao động",
      "Dân chủ tư sản hiện đại hơn vì ai nhiều tiền hơn sẽ có nhiều tiếng nói hơn",
      "Không có sự khác biệt nào",
      "Dân chủ XHCN chỉ cho phép người làm nhà nước tham gia"
    ],
    correctAnswer: 0,
    explanation: "Dân chủ XHCN đảm bảo quyền lực thực sự thuộc về nhân dân, không bị chi phối hay lũng đoạn bởi các tập đoàn tài phiệt tư bản truyền thông."
  },
  {
    id: 10,
    topic: "Trách Nhiệm Công Dân Số",
    scenario: "Khi gặp một thông tin xuyên tạc bôi nhọ danh dự của cá nhân hoặc bóp méo đường lối của Đảng và Nhà nước trên Facebook, hành vi chuẩn mực nhất là:",
    options: [
      "Bấm like và share để mọi người cùng vào tranh cãi",
      "Báo cáo (Report) vi phạm cho nền tảng và cơ quan chức năng qua đường dây nóng an ninh mạng",
      "Viết bài chửi bới bằng ngôn từ thô tục để trả đũa",
      "Lưu lại để gửi cho bạn bè xem giải trí"
    ],
    correctAnswer: 1,
    explanation: "Thực thi dân chủ gắn liền với văn hóa ứng xử số văn minh và tuân thủ Luật An ninh mạng để bảo vệ không gian mạng lành mạnh."
  },
  {
    id: 11,
    topic: "Dân Chủ Trực Tiếp & Đại Diện",
    scenario: "Việc cử tri theo dõi trực tiếp các phiên chất vấn của Quốc hội qua truyền hình trực tiếp và mạng xã hội, sau đó phản hồi tới đại biểu qua email/app là sự kết hợp giữa:",
    options: [
      "Dân chủ chủ nô và dân chủ phong kiến",
      "Dân chủ trực tiếp và Dân chủ đại diện (gián tiếp) trên nền tảng số",
      "Tự do vô chính phủ và độc đoán",
      "Chỉ là hình thức dân chủ hình thức"
    ],
    correctAnswer: 1,
    explanation: "Truyền thông số tạo cầu nối hoàn hảo giữa dân chủ đại diện (Đại biểu Quốc hội) và dân chủ trực tiếp (cử tri theo dõi, giám sát và gửi kiến nghị tức thì)."
  },
  {
    id: 12,
    topic: "Cạm Bẫy Deepfake",
    scenario: "Một video clip ứng dụng Deepfake giả mạo hình ảnh lãnh đạo kêu gọi người dân quyên góp tiền vào một tài khoản cá nhân. Đây là mối đe dọa gì trên không gian số?",
    options: [
      "Một trò đùa vô hại của công nghệ",
      "Hành vi lừa đảo và phá hoại niềm tin vào nền dân chủ, cơ quan công quyền",
      "Minh chứng cho sự phát triển của tự do biểu đạt",
      "Biểu hiện của dân chủ trực tiếp số"
    ],
    correctAnswer: 1,
    explanation: "Công nghệ Deepfake bị kẻ xấu lợi dụng để thao túng thông tin, phá hoại lòng tin của nhân dân và trật tự an ninh xã hội."
  },
  {
    id: 13,
    topic: "Văn Hóa Phản Biện Số",
    scenario: "Một diễn đàn thanh niên trực tuyến tổ chức bàn luận về chính sách hỗ trợ khởi nghiệp cho sinh viên. Tiêu chí nào thể hiện phản biện xã hội mang tính dân chủ XHCN chân chính?",
    options: [
      "Đóng góp trên tinh thần xây dựng, có số liệu thực tế, tôn trọng sự thật khách quan",
      "Bác bỏ mọi đề xuất của chính quyền chỉ để tỏ ra mình ngầu",
      "Công kích cá nhân những người có ý kiến khác biệt với mình",
      "Dùng tài khoản ẩn danh để kích động ngôn từ thù ghét"
    ],
    correctAnswer: 0,
    explanation: "Phản biện xã hội trong nền dân chủ XHCN luôn hướng tới mục đích hoàn thiện chính sách, vì lợi ích chung của nhân dân và đất nước."
  },
  {
    id: 14,
    topic: "Minh Bạch Ngân Sách Số",
    scenario: "Việc công khai dự toán thu chi ngân sách nhà nước, các quỹ từ thiện xã hội trên cổng thông tin điện tử giúp khắc phục triệt để căn bệnh nào sau đây?",
    options: [
      "Bệnh quan liêu, tham nhũng và 'lợi ích nhóm'",
      "Bệnh phát triển quá nhanh của công nghệ",
      "Bệnh thừa thãi thông tin",
      "Bệnh bình đẳng xã hội"
    ],
    correctAnswer: 0,
    explanation: "Công khai, minh bạch dữ liệu số là vũ khí sắc bén nhất để nhân dân thực hiện quyền kiểm tra, giám sát, tiêu diệt tệ nạn quan liêu, tham nhũng."
  },
  {
    id: 15,
    topic: "Sứ Mệnh Thanh Niên",
    scenario: "Đại hội XIII của Đảng nhấn mạnh vai trò làm chủ của thế hệ trẻ trong kỷ nguyên số. Trách nhiệm tiên phong của sinh viên đại học hiện nay là gì?",
    options: [
      "Đứng ngoài cuộc các vấn đề chính trị - xã hội",
      "Làm chủ tri thức công nghệ, lan tỏa thông tin tích cực, đấu tranh phản bác quan điểm sai trái trên mạng",
      "Chỉ tập trung kiếm tiền, không quan tâm tới pháp luật an ninh mạng",
      "Lan truyền bất kỳ trào lưu (trend) nào trên mạng miễn là nhiều view"
    ],
    correctAnswer: 1,
    explanation: "Sinh viên là lực lượng nòng cốt của trí thức trẻ, tiên phong xây dựng văn hóa số lành mạnh và bảo vệ nền tảng tư tưởng xã hội chủ nghĩa."
  }
];

export const MLN131_ROAST_PROMPTS: RoastPrompt[] = [
  {
    id: 'roast_prompt_1',
    platform: 'confessions',
    authorName: 'Sinh Viên Gánh Team',
    authorHandle: '@nguoi_ganh_team_bat_dac_di',
    authorBadge: 'FPTU Confessions #13109',
    timeAgo: '18 phút trước',
    postTag: '#PhotNhomMLN131 #GanhTeamCongLung',
    category: 'ĐẠI CHIẾN GÁNH TEAM TIỂU LUẬN',
    situation: 'Nhóm 5 bạn làm tiểu luận MLN131: 1 bạn bận đi làm thêm, 1 bạn ngủ quên, 1 bạn "seen" không rep, 1 bạn nộp nội dung copy 100% từ ChatGPT. Mình gánh từ A-Z đến 3h sáng. Đến hạn nộp các bạn bảo: "Ghi tên bọn tao chung với, anh em trong lớp không giúp nhau thì sống ích kỷ thế?".',
    context: 'Bản chất công bằng xã hội, trách nhiệm cá nhân trong tập thể và căn bệnh "ăn bám danh nghĩa đoàn kết" trong học thuật.',
    mockStats: {
      likes: '3.8K',
      comments: '642',
      shares: '189',
    },
    baitComment: {
      author: 'Bạn Cùng Nhóm Thảo Mai',
      handle: '@thanh_thao_mai_2k5',
      text: 'Thôi dĩ hòa vi quý bạn ơi, giúp nhau cùng qua môn chứ làm gì mà gắt, tình bạn mới là quan trọng chứ điểm số có mang theo cả đời được đâu!',
      likes: '42',
    },
    starterTemplates: [
      'Gạch tên thẳng tay không thương tiếc!',
      'Dĩ hòa vi quý cái gì tầm này...',
      'Học MLN131 về công bằng xã hội chưa?',
      'Lười biếng còn đòi ăn bám điểm!',
    ],
  },
  {
    id: 'roast_prompt_2',
    platform: 'facebook',
    authorName: 'Hội Nộp Quỹ Lớp Chăm Chỉ',
    authorHandle: '@hoi_nhung_nguoi_dong_tien_quy',
    authorBadge: 'Group Lớp K18',
    timeAgo: '35 phút trước',
    postTag: '#SaoKeQuyLop #CheckVARBanCanSu',
    category: 'CHECK VAR SAO KÊ QUỸ LỚP',
    situation: 'Tổng thu quỹ lớp 15 triệu. Bảng sao kê cuối kỳ: Tiền photo slide 150k, tiền in đề cương 100k, tiền "bồi dưỡng ban cán sự họp bàn kế hoạch" 8 triệu, tiền nước ngọt giao lưu 5 triệu. Mình thắc mắc xin hóa đơn đỏ thì thủ quỹ mắng là "xét nét, phá hoại tình đoàn kết" rồi kick mình khỏi nhóm Zalo!',
    context: 'Quyền "Dân biết, Dân bàn, Dân kiểm tra" trong quản trị tập thể, chống tệ nạn quan liêu, mập mờ tài chính số.',
    mockStats: {
      likes: '5.2K',
      comments: '1.1K',
      shares: '420',
    },
    baitComment: {
      author: 'Thủ Quỹ Tự Ái',
      handle: '@thu_quy_vo_toi',
      text: 'Tiền họp là công sức ban cán sự thức đêm lo cho lớp, mấy người chỉ biết ngồi không hưởng thụ thì biết cái gì mà soi xét!',
      likes: '18',
    },
    starterTemplates: [
      'Dân biết dân kiểm tra đâu rồi thủ quỹ?',
      'Sao kê cụ thể từng nghìn đê bạn ơi!',
      'Ủa alo tiền mồ hôi nước mắt sinh viên?',
      'Báo cáo cố vấn học tập ngay và luôn!',
    ],
  },
  {
    id: 'roast_prompt_3',
    platform: 'threads',
    authorName: 'Chuyên Viên Phông Bạt 2k4',
    authorHandle: '@shark_lùa_gà_lượng_tử',
    authorBadge: 'Hot Threads / Tích Xanh',
    timeAgo: '1 giờ trước',
    postTag: '#TuDoTaiChinh #GenZKhoiNghiep',
    category: 'THREADS FLEX LÙA GÀ KHÓA HỌC',
    situation: 'Mình 2k4, bỏ học đại học, chỉ ngồi nhà click chuột làm "tiếp thị liên kết lượng tử" tháng kiếm 80 triệu nhẹ tênh. Thấy mấy bạn sinh viên cặm cụi đi học với làm thêm part-time 20k/h mà thấy tội nghiệp. Thời đại 4.0 rồi, ai nghèo là do tư duy lười đổi mới và không chịu mua khóa học 5 củ của mình thôi!',
    context: 'Nhận thức đúng đắn về giá trị của lao động chân chính và tri thức khoa học, vạch trần bẫy dân túy tài chính Ponzi.',
    mockStats: {
      likes: '1.4K',
      comments: '980',
      shares: '315',
    },
    baitComment: {
      author: 'Seeder Đa Cấp Ruột',
      handle: '@seeder_trung_thanh',
      text: 'Công nhận thầy nói chuẩn tư duy triệu đô, em vừa đóng 5 triệu học thử 3 ngày đã thấy tương lai rực rỡ rồi ạ!',
      likes: '9',
    },
    starterTemplates: [
      'Lùa gà đa cấp lộ liễu thế anh?',
      'Lượng tử hay Ponzi lừa đảo công nghệ cao?',
      'Lấy tư cách gì chê lao động chân chính?',
      'Check VAR thuế thu nhập cá nhân chưa?',
    ],
  },
  {
    id: 'roast_prompt_4',
    platform: 'facebook',
    authorName: 'Thực Thần Cổng Trường',
    authorHandle: '@an_de_song_qua_ky_thi',
    authorBadge: 'Góc Ẩm Thực Sinh Viên',
    timeAgo: '45 phút trước',
    postTag: '#ReviewComSinhVien #ProteinLa',
    category: 'BÓC PHỐT CƠM SINH VIÊN PROTEIN LẠ',
    situation: 'Trưa nay ăn cơm sườn 25k ở quán ruột cổng phụ trường thì phát hiện nguyên một chú "tiểu cường" (gián) nằm yên bình dưới lớp rau muống. Mình ra phản ánh nhẹ nhàng xin đổi đĩa khác thì cô chủ quán quát ầm lên: "Rau sạch sâu bọ mới đậu vào, sinh viên thời nay khó tính quá, không ăn thì lượn đừng có làm màu bóc phốt!".',
    context: 'Văn hóa tiêu dùng số, quyền phản biện của công dân số và trách nhiệm bảo vệ quyền lợi hợp pháp của người tiêu dùng.',
    mockStats: {
      likes: '4.6K',
      comments: '780',
      shares: '512',
    },
    baitComment: {
      author: 'Khách Quen Ba Phải',
      handle: '@ba_phai_an_tam',
      text: 'Khuất mắt khôn coi, ăn chín uống sôi tí có chết ai đâu mà bóc phốt làm ăn của người ta, tạo nghiệp thất đức đấy bạn!',
      likes: '12',
    },
    starterTemplates: [
      'Vệ sinh an toàn thực phẩm đâu ra thế?',
      'Rau sạch hay bẩn thỉu mất vệ sinh?',
      'Khách hàng có quyền đòi hỏi sự sạch sẽ!',
      'Báo ban an toàn thực phẩm vào cuộc ngay!',
    ],
  },
  {
    id: 'roast_prompt_5',
    platform: 'confessions',
    authorName: 'Thế Thân Số Uy Tín 100%',
    authorHandle: '@dich_vu_hoc_ho_bao_pass',
    authorBadge: 'Hội Thuê Điểm Danh Đại Học',
    timeAgo: '2 giờ trước',
    postTag: '#HocHoDiemDanhHo #BaoPassMLN131',
    category: 'DỊCH VỤ THẾ THÂN SỐ GIAN LẬN',
    situation: 'Nhận điểm danh hộ, làm bài tập lớn hộ môn MLN131 và Triết học. Có sẵn app Fake GPS, fake phôi thẻ sinh viên quét mã QR. Cam kết điểm B+ trở lên, bảo mật tuyệt đối. Giá chỉ bằng 2 cốc trà sữa. Đừng để mấy môn lý luận làm ảnh hưởng đến thời gian leo rank và ngủ nướng của bạn!',
    context: 'Pháp quyền số, kỷ cương giảng đường và sự tha hóa phẩm chất đạo đức học thuật khi lạm dụng công nghệ gian dối.',
    mockStats: {
      likes: '2.1K',
      comments: '510',
      shares: '230',
    },
    baitComment: {
      author: 'Sinh Viên Lười Học',
      handle: '@sv_thich_ngu_nuong',
      text: 'Dịch vụ uy tín nha mọi người, kỳ trước mình thuê bạn này pass môn nhẹ re không cần bước chân lên giảng đường buổi nào!',
      likes: '25',
    },
    starterTemplates: [
      'Gian lận học thuật coi chừng đuổi học!',
      'Học hộ rồi ra trường ai đi làm hộ bạn?',
      'Mất tiền còn rước họa vào thân!',
      'Tự hào gì cái thói giả dối lừa thầy phản bạn?',
    ],
  },
  {
    id: 'roast_prompt_6',
    platform: 'tiktok',
    authorName: 'Tân Binh Cần Cứu Viện',
    authorHandle: '@sv_nam_nhat_hoang_mang',
    authorBadge: 'Cảnh Giác Sinh Viên',
    timeAgo: '10 phút trước',
    postTag: '#CanhGiacLuaDao #ViecNheLuongCao',
    category: 'BẪY LỪA ĐẢO VIỆC NHẸ LƯƠNG CAO',
    situation: 'Em nhận được tin nhắn tuyển làm cộng tác viên mẫu ảnh online lương 500k/buổi. Vào việc họ bảo phải chuyển cọc 1 triệu để "xác minh tài khoản". Em chuyển xong thì họ ép làm nhiệm vụ like video TikTok nạp thêm 5 triệu nữa mới giải ngân cả gốc lẫn lương. Giờ họ gửi ảnh đơn kiện dọa nếu em bỏ ngang sẽ báo công an vì phá vỡ hợp đồng!',
    context: 'Tội phạm công nghệ cao thao túng tâm lý nỗi sợ, kỹ năng tự vệ số và nhận thức pháp luật an ninh mạng của thanh niên.',
    mockStats: {
      likes: '6.7K',
      comments: '1.3K',
      shares: '890',
    },
    baitComment: {
      author: 'CSKH Đa Cấp Ảo',
      handle: '@cskh_uy_tin_quoc_te',
      text: 'Em cứ yên tâm nạp nốt nhiệm vụ cuối là hệ thống tự động hoàn tiền kèm 30% hoa hồng nhé, công ty có con dấu mã số thuế đàng hoàng!',
      likes: '5',
    },
    starterTemplates: [
      'Bẫy lừa đảo nạp tiền nhiệm vụ 100%!',
      'Chặn ngay lập tức và ra công an trình báo!',
      'Hợp đồng miệng với dọa kiện online lừa ai?',
      'Tuyệt đối không chuyển thêm một đồng nào!',
    ],
  },
];

export const ROAST_QUICK_CHIPS: string[] = [
  'Gạch tên thẳng tay!',
  'Dân biết dân bàn nha!',
  'Sao kê từng nghìn đê!',
  'Lùa gà lộ liễu!',
  'Học lại MLN131 đi!',
  'Đỉnh nóc kịch trần!',
  'Check VAR ngay!',
  'Chuyên gia mõm!',
  'Báo công an liền!',
  'Dĩ hòa vi quý cái gì!',
  'Nói có sách mách có chứng!',
  'Tự do có kỷ cương bạn ơi!',
];

export const VIETNAMESE_ROAST_BANK: string[] = [
  'Gạch tên khỏi nhóm bài tập lớn ngay, lười biếng mà đòi hưởng thụ thành quả!',
  'Tiền họp 8 triệu mà tiền tài liệu 100k, sao kê kiểu này công an nhìn còn chóng mặt!',
  'Bảo dĩ hòa vi quý tình bạn quan trọng, thế lúc thức đêm gánh team tình bạn ở đâu?',
  'Khóa học 80 triệu/tháng nhưng người bán vẫn dùng sim rác gọi điện chèo kéo.',
  'Quán cơm bán sâu bọ bảo rau sạch, tư duy bán hàng kiểu này sớm muộn cũng sập tiệm!',
  'Thuê người học hộ MLN131, đến lúc ra đời bốc phải bẫy lừa thì ai gánh hộ cho?',
  'Dân biết dân bàn mà hỏi hóa đơn đỏ thì kick khỏi nhóm, dân chủ kiểu gì vậy bạn thủ quỹ?',
  'Cộng tác viên mẫu ảnh nạp tiền làm nhiệm vụ, bài lừa này cũ rích mà vẫn có người dính.',
  'Học MLN131 về công bằng xã hội chưa mà phát biểu câu nghe vô trách nhiệm thế?',
  'Bảo không làm mà vẫn có ăn thì chỉ có trên mấy trang lừa đảo công nghệ cao thôi!',
  'Áp fake GPS điểm danh hộ tưởng thông minh, trường quét phát một là đình chỉ học.',
  'Check VAR sao kê quỹ lớp ngay lập tức, tiền của tập thể không phải tiền chùa!',
  'Lùa gà đa cấp tiền ảo lượng tử, mang giáo trình MLN131 ra mà soi rọi lại nhân cách!',
  'Tự hào kiếm tiền nhẹ tênh rồi đi chê sinh viên nghèo, phông bạt vừa thôi anh bạn!',
  'Rau muống có gián bảo sạch, chuẩn bị đón đoàn kiểm tra an toàn thực phẩm đi là vừa!',
  'Bị dọa kiện online vì không nạp thêm tiền, tỉnh táo lên ra ngay công an phường trình báo!',
  'Ăn bám công sức người khác mà coi như hiển nhiên, đạo đức học thuật vứt đi đâu rồi?',
  'Thủ quỹ mà chi tiêu kiểu giấu giếm thì xứng đáng bị phế truất chức vụ ngay hôm nay!',
  'Học tập là quyền và nghĩa vụ thiêng liêng, thuê học hộ là tự biến mình thành kẻ vô tri!',
  'Đừng mang mác dĩ hòa vi quý ra để bao che cho hành vi gian lận và ỷ lại!',
  'Bản chất của dân chủ là công khai minh bạch, giấu sao kê là có tật giật mình!',
  'Lên mạng flex đạo lý làm giàu, ngoài đời nợ tiền photo tài liệu chưa trả.',
  'Sinh viên thời đại số phải có tư duy phản biện, đừng để mấy chiêu trò thao túng dắt mũi.',
  'Cứ ngỡ là chuyên gia tài chính 4.0, ai ngờ trùm lừa đảo công nghệ cao!',
  'Bảo vệ quyền lợi chính đáng của mình không phải làm màu, đó là trách nhiệm công dân!',
  'Bấm report liền tay những nội dung lừa đảo độc hại vì một môi trường số sạch đẹp.',
  'Tự do ngôn luận không đồng nghĩa với tự do bịa đặt và lăng mạ người khác.',
  'Nói có sách mách có chứng, phản biện có văn hóa mới là phong cách của sinh viên!',
  'Nhóm 5 người mà 4 người tàng hình, đề nghị thầy cô cho điểm âm với những bạn ăn bám.',
  'Tiền bạc phân minh, ái tình dứt khoát, sao kê quỹ lớp là chuyện đương nhiên phải làm!',
];

export const PROFANITY_FILTER_WORDS: string[] = [
  'dm',
  'dmm',
  'vcl',
  'cl',
  'đm',
  'đmm',
  'vl',
  'cc',
  'cac',
  'lồn',
  'buồi',
  'cặc',
  'đụ',
  'địt',
  'chó má',
  'thằng chó',
  'con chó',
];

export function sanitizeRoastText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let sanitized = text.trim().slice(0, 120);
  for (const word of PROFANITY_FILTER_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'gi');
    sanitized = sanitized.replace(regex, (match, p1, p2) => `${p1}[VAR đã che 🎦]${p2}`);
  }
  return sanitized;
}

// ==========================================
// Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex Bank)
// ==========================================
export const MLN131_FACT_OR_CAP_QUESTIONS: FactCapQuestion[] = [
  {
    id: 1,
    statement: "Trên không gian mạng, quyền tự do ngôn luận là tuyệt đối: bạn có thể lập nick ảo ẩn danh để bôi nhọ bất kỳ ai mà không bị pháp luật xử lý.",
    isFact: false,
    explanation: "Theo Điều 8 Luật An ninh mạng và nguyên lý Dân chủ XHCN, tự do dân chủ luôn đi liền với pháp luật và kỷ cương; không có tự do vô chính phủ chà đạp danh dự người khác.",
    category: "Pháp quyền số",
    basePoints: 1000,
  },
  {
    id: 2,
    statement: "Cổng Dịch vụ công Quốc gia và ứng dụng VNeID (Đề án 06) là minh chứng sống động cho việc hiện thực hóa nguyên tắc 'Dân thụ hưởng' trong công cuộc chuyển đổi số.",
    isFact: true,
    explanation: "'Dân thụ hưởng' là mục tiêu tối thượng: mọi tiện ích chuyển đổi số quốc gia đều phải hướng tới phục vụ đời sống thuận tiện, bình đẳng, văn minh cho toàn thể nhân dân.",
    category: "Dân thụ hưởng số",
    basePoints: 1000,
  },
  {
    id: 3,
    statement: "Việc bình luận spam hàng loạt 'Ủa alo, đổi tiền giấy sang tiền ảo kìa bà con' dù chỉ là đùa vui câu view vẫn có thể bị xử phạt hành chính từ 10 - 20 triệu đồng theo Nghị định 15/2020/NĐ-CP.",
    isFact: true,
    explanation: "Hành vi tung tin giả mạo, sai sự thật gây hoang mang dư luận trên không gian mạng đều bị xử lý nghiêm khắc bất kể lý do 'đùa vui'.",
    category: "Chống tin giả",
    basePoints: 1000,
  },
  {
    id: 4,
    statement: "Khái niệm 'Dân bàn' trong thời đại số có nghĩa là chỉ cần share bài chửi đổng trên mạng xã hội là đã hoàn thành trách nhiệm công dân tham gia quản lý nhà nước.",
    isFact: false,
    explanation: "'Dân bàn' đòi hỏi sự tham gia có trách nhiệm, khoa học thông qua các kênh tham vấn chính sách, cổng thông tin điện tử chính thức, không phải chửi đổng vô căn cứ.",
    category: "Dân bàn số",
    basePoints: 1000,
  },
  {
    id: 5,
    statement: "Mô hình 'Tổ công nghệ số cộng đồng' đưa đoàn viên thanh niên và sinh viên về từng thôn bản hướng dẫn nông dân dùng smartphone bán nông sản là biểu hiện sinh động của 'Dân làm' trong liên minh giai cấp hiện đại.",
    isFact: true,
    explanation: "Sự gắn kết giữa trí thức trẻ, công nhân công nghệ và nông dân số hóa chính là sự phát triển sáng tạo của khối liên minh công - nông - trí thức thời đại 4.0.",
    category: "Liên minh số",
    basePoints: 1000,
  },
  {
    id: 6,
    statement: "Thuật toán đề xuất của TikTok, Facebook luôn trung lập 100% và chỉ hướng tới sự thật khách quan, không bao giờ thiên vị nội dung giật gân, câu tương tác độc hại.",
    isFact: false,
    explanation: "Các nền tảng tư bản công nghệ tối ưu hóa thuật toán vì lợi nhuận quảng cáo và thời gian giữ chân người dùng (attention economy), thường khuếch đại tin giật gân, độc hại.",
    category: "Thuật toán & Tư bản số",
    basePoints: 1000,
  },
  {
    id: 7,
    statement: "Người dân có quyền quay clip và gửi phản ánh qua ứng dụng Đô thị thông minh (như Hue-S, iHanoi, VNeID) để cơ quan thẩm quyền vào cuộc xử lý sai phạm — đây là hình thức 'Dân kiểm tra, giám sát' thời đại số.",
    isFact: true,
    explanation: "Giám sát số hóa giúp tăng tính minh bạch, trao quyền lực thực chất cho nhân dân tham gia kiểm tra hoạt động của cơ quan công quyền.",
    category: "Dân giám sát số",
    basePoints: 1000,
  },
  {
    id: 8,
    statement: "Dân túy mạng (Digital Populism) là một xu hướng tốt vì nó luôn giúp nhân dân lao động đòi lại công bằng nhanh nhất mà không cần thông qua pháp luật.",
    isFact: false,
    explanation: "Dân túy mạng lợi dụng bức xúc nhất thời của đám đông để trục lợi cá nhân hoặc chống phá, làm xói mòn thượng tôn pháp luật và trật tự xã hội.",
    category: "Chống dân túy",
    basePoints: 1000,
  },
  {
    id: 9,
    statement: "Mọi công dân Việt Nam từ đủ 18 tuổi đều có quyền bình đẳng bầu cử Đại biểu Quốc hội và HĐND các cấp qua danh sách niêm yết công khai và các cổng thông tin số hóa.",
    isFact: true,
    explanation: "Quyền bầu cử bình đẳng, phổ thông đầu phiếu là nguyên tắc căn bản của nền dân chủ XHCN Việt Nam, được bảo đảm bằng pháp luật và hạ tầng dữ liệu số hóa.",
    category: "Quyền bầu cử số",
    basePoints: 1000,
  },
  {
    id: 10,
    statement: "Nếu bạn không quan tâm đến chính trị và xã hội, bạn có thể tự do sống trong 'bong bóng thông tin' của mình trên mạng mà không chịu bất kỳ tác động tiêu cực nào từ tin giả và lừa đảo số.",
    isFact: false,
    explanation: "Sự thờ ơ và thiếu hiểu biết lý luận - pháp luật số khiến công dân dễ dàng trở thành nạn nhân của các bẫy lừa đảo Ponzi, deepfake và các chiến dịch thao túng tâm lý đám đông.",
    category: "Bản lĩnh số",
    basePoints: 1000,
  },
];

// ==========================================
// Mode 3: Trưng Cầu Dân Ý: Đoán Phe Đa Số (The Consensus Dilemma Bank)
// ==========================================
export const MLN131_CONSENSUS_DILEMMAS: DilemmaItem[] = [
  {
    id: 1,
    title: "AI Giám Sát An Ninh Số vs Quyền Riêng Tư Cá Nhân",
    topic: "An ninh mạng & Quyền công dân",
    scenario: "Nhà nước xem xét triển khai hệ thống AI phân tích dữ liệu mạng xã hội công khai để phát hiện sớm các đường dây lừa đảo tài chính qua mạng và bảo vệ người cao tuổi. Tuy nhiên, một bộ phận netizen lo ngại thuật toán có thể xâm lấn không gian riêng tư cá nhân.",
    choiceA: "Ủng hộ AI giám sát diện rộng để tối ưu hóa an ninh số & bảo vệ người yếu thế",
    choiceB: "Ưu tiên bảo vệ quyền riêng tư cá nhân tuyệt đối, siết chặt giới hạn can thiệp của AI",
    contextMLN131: "Mối quan hệ biện chứng giữa Nhà nước pháp quyền XHCN bảo vệ trật tự công cộng và bảo đảm quyền con người, quyền công dân trên không gian số.",
  },
  {
    id: 2,
    title: "Định Danh Mạng Bắt Buộc (VNeID) vs Tự Do Ẩn Danh",
    topic: "Kỷ cương số & Trách nhiệm xã hội",
    scenario: "Để quét sạch vấn nạn botnet lùa gà, bạo lực mạng và tung tin giả gây lũng đoạn kinh tế, chính sách yêu cầu 100% tài khoản mạng xã hội phải xác thực căn cước công dân (VNeID). Phe ủng hộ cho rằng có nick chính chủ thì mới có trách nhiệm; phe phản đối lo ngại mất đi tính tự do phản biện ẩn danh.",
    choiceA: "Bắt buộc định danh 100% bằng CCCD/VNeID để lập lại kỷ cương và an toàn số",
    choiceB: "Cho phép giữ quyền ẩn danh để khuyến khích tự do ngôn luận và phản biện đa chiều",
    contextMLN131: "Dân chủ đi đôi với kỷ cương pháp luật trong nền dân chủ XHCN vs tự do vô chính phủ trên không gian số.",
  },
  {
    id: 3,
    title: "Thuật Toán Đề Xuất: Can Thiệp Nhà Nước vs Tự Do Thị Trường",
    topic: "Quản trị nền tảng số xuyên biên giới",
    scenario: "Các nền tảng xuyên biên giới liên tục đẩy video nhảm nhí, bạo lực và bói toán mê tín dị đoan lên tab thịnh hành vì nó có nhiều tương tác kiếm tiền quảng cáo. Xã hội đứng trước 2 phương án xử lý.",
    choiceA: "Nhà nước áp đặt chế tài hành chính mạnh tay và yêu cầu mở mã nguồn thuật toán kiểm toán",
    choiceB: "Để cộng đồng tự điều tiết bằng chiến dịch tẩy chay và văn hóa tiêu dùng số của netizen",
    contextMLN131: "Vai trò quản lý của Nhà nước pháp quyền XHCN đối với các tập đoàn công nghệ tư bản xuyên biên giới.",
  },
  {
    id: 4,
    title: "Đại Biểu Dân Cử Livestream 100% vs Phiên Thảo Luận Chuyên Sâu",
    topic: "Dân chủ trực tiếp & Dân chủ đại diện",
    scenario: "Đề xuất yêu cầu các kỳ họp HĐND và tiếp xúc cử tri phải livestream 100% trên TikTok/Facebook để sinh viên và dân mạng cùng xem và bình luận trực tiếp. Một số ý kiến lo ngại đại biểu sẽ chạy theo view dân túy thay vì phân tích chính sách sâu sắc.",
    choiceA: "Livestream toàn bộ 100% để nhân dân trực tiếp thực hiện 'Dân biết, Dân bàn, Dân kiểm tra'",
    choiceB: "Giữ các phiên thảo luận kín chuyên sâu, chỉ công bố kết quả và biên bản giải trình chính thức",
    contextMLN131: "Phát huy dân chủ trực tiếp kết hợp dân chủ đại diện trong kỷ nguyên truyền thông số, phòng ngừa bệnh dân túy mạng.",
  },
  {
    id: 5,
    title: "Deepfake Giáo Dục Lý Luận vs Lệnh Cấm Triệt Để",
    topic: "Đổi mới phương pháp tuyên truyền lý luận",
    scenario: "Một nhóm sinh viên MLN131 sử dụng công nghệ Deepfake và AI Voice tạo video tái hiện các nhà tư tưởng Mác - Lênin đối thoại hài hước về các vấn đề kinh tế số hiện đại. Video cực kỳ viral và giúp giới trẻ ham học lý luận, nhưng có ý kiến cho rằng việc tạo hình ảnh giả mạo nhân vật lịch sử tiềm ẩn nguy cơ xuyên tạc.",
    choiceA: "Khuyến khích sáng tạo số có kiểm duyệt để đưa lý luận Mác - Lênin đến gần giới trẻ",
    choiceB: "Cấm tuyệt đối sử dụng Deepfake hình ảnh lãnh tụ/nhân vật lịch sử để bảo đảm tính tôn nghiêm",
    contextMLN131: "Kế thừa và phát triển sáng tạo Chủ nghĩa Mác - Lênin trong kỷ nguyên số, kết hợp bảo vệ nền tảng tư tưởng của Đảng.",
  },
  {
    id: 6,
    title: "Trách Nhiệm Nền Tảng: Tạm Khóa Ngay Nghi Vấn vs Chờ Phán Quyết Luật",
    topic: "Quyền bảo vệ tài sản & Pháp quyền số",
    scenario: "Khi xuất hiện bài đăng tố cáo một dự án bất động sản có dấu hiệu lừa đảo đa cấp nhưng chưa có kết luận của cơ quan công an: Nếu nền tảng gỡ ngay có thể dập tắt lừa đảo nhưng triệt tiêu tiếng nói phản biện sớm; nếu để lại có thể khiến thêm hàng ngàn người mắc bẫy.",
    choiceA: "Nền tảng phải tạm khóa/gỡ ngay bài đăng nghi vấn theo cơ chế phòng ngừa rủi ro cộng đồng",
    choiceB: "Chỉ được gỡ khi có phán quyết hoặc yêu cầu bằng văn bản từ cơ quan pháp luật có thẩm quyền",
    contextMLN131: "Nguyên tắc Nhà nước pháp quyền xã hội chủ nghĩa: mọi quyết định cưỡng chế đều phải dựa trên trình tự luật định.",
  },
];

