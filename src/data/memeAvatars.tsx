import React from 'react';

// ==========================================
// 1. Vector SVG Persona Components (100x100)
// Neo-brutalist cartoon meme aesthetic with solid outlines
// ==========================================

export interface SvgProps {
  className?: string;
  size?: number;
}

// 1. Anh Hùng Bàn Phím (Keyboard Warrior)
export const KeyboardWarriorSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#EF233C" stroke="#000" strokeWidth="4" />
    {/* Keycap Helmet Base */}
    <rect x="22" y="16" width="56" height="32" rx="6" fill="#1E293B" stroke="#000" strokeWidth="3" />
    {/* Keyboard Keys on Helmet */}
    <rect x="26" y="20" width="12" height="10" rx="2" fill="#FFD166" stroke="#000" strokeWidth="1.5" />
    <text x="32" y="27" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#000">ESC</text>
    <rect x="42" y="20" width="16" height="10" rx="2" fill="#E2E8F0" stroke="#000" strokeWidth="1.5" />
    <text x="50" y="27" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#000">F1</text>
    <rect x="62" y="20" width="12" height="10" rx="2" fill="#EF233C" stroke="#000" strokeWidth="1.5" />
    <text x="68" y="27" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#FFF">DEL</text>
    {/* Fiery Eyebrows */}
    <path d="M28 48L44 54" stroke="#FFD166" strokeWidth="4" strokeLinecap="round" />
    <path d="M72 48L56 54" stroke="#FFD166" strokeWidth="4" strokeLinecap="round" />
    {/* Glowing Red Battle Eyes */}
    <ellipse cx="36" cy="58" rx="6" ry="7" fill="#FFF" stroke="#000" strokeWidth="2.5" />
    <circle cx="37" cy="58" r="3" fill="#EF233C" />
    <circle cx="39" cy="56" r="1.5" fill="#FFF" />
    <ellipse cx="64" cy="58" rx="6" ry="7" fill="#FFF" stroke="#000" strokeWidth="2.5" />
    <circle cx="63" cy="58" r="3" fill="#EF233C" />
    <circle cx="65" cy="56" r="1.5" fill="#FFF" />
    {/* Keyboard Teeth Mouth */}
    <rect x="32" y="72" width="36" height="14" rx="4" fill="#0F172A" stroke="#000" strokeWidth="2.5" />
    <line x1="41" y1="72" x2="41" y2="86" stroke="#E2E8F0" strokeWidth="2" />
    <line x1="50" y1="72" x2="50" y2="86" stroke="#E2E8F0" strokeWidth="2" />
    <line x1="59" y1="72" x2="59" y2="86" stroke="#E2E8F0" strokeWidth="2" />
    {/* Sweat / Rage Sparks */}
    <path d="M12 36L18 42M82 36L88 42" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 2. Cảnh Sát Chính Tả (Grammar Police)
export const GrammarPoliceSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#118AB2" stroke="#000" strokeWidth="4" />
    {/* Police Cap Visor */}
    <ellipse cx="50" cy="28" rx="34" ry="12" fill="#0B132B" stroke="#000" strokeWidth="3" />
    {/* Police Cap Body */}
    <path d="M22 28C22 14 34 8 50 8C66 8 78 14 78 28Z" fill="#1C2541" stroke="#000" strokeWidth="3" />
    {/* Gold Police Badge */}
    <polygon points="50,14 55,22 45,22" fill="#FFD166" stroke="#000" strokeWidth="1.5" />
    <circle cx="50" cy="20" r="2.5" fill="#EF233C" />
    {/* Stern Eyes */}
    <ellipse cx="36" cy="48" rx="6" ry="6" fill="#FFF" stroke="#000" strokeWidth="2.5" />
    <circle cx="36" cy="48" r="2.5" fill="#000" />
    {/* Golden Monocle on Right Eye */}
    <circle cx="64" cy="48" r="9" fill="rgba(255,209,102,0.25)" stroke="#FFD166" strokeWidth="3" />
    <line x1="72" y1="52" x2="78" y2="70" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" />
    {/* Strict Straight Mouth */}
    <line x1="38" y1="70" x2="62" y2="70" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
    {/* Giant Red Pen held up */}
    <rect x="74" y="32" width="8" height="38" rx="2" fill="#EF233C" stroke="#000" strokeWidth="2" transform="rotate(18 74 32)" />
    <polygon points="86,70 82,78 78,74" fill="#E2E8F0" stroke="#000" strokeWidth="1.5" />
    {/* Question/Exclamation Mark */}
    <text x="18" y="74" fontSize="14" fontWeight="900" fill="#FFD166">?!</text>
  </svg>
);

// 3. Trọng Tài Check VAR (VAR Inspector)
export const VarInspectorSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => {
  const clipId = React.useId ? 'ref-clip-' + React.useId().replace(/:/g, '') : 'ref-clip-dyn';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="46" fill="#FFD166" stroke="#000" strokeWidth="4" />
      {/* Referee Shirt Stripes - dynamic clipPath id={clipId} replacing static clipPath id="ref-clip" */}
      <clipPath id={clipId}>
        <circle cx="50" cy="50" r="44" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x="15" y="70" width="12" height="30" fill="#000" />
        <rect x="37" y="70" width="12" height="30" fill="#000" />
        <rect x="59" y="70" width="12" height="30" fill="#000" />
        <rect x="81" y="70" width="12" height="30" fill="#000" />
      </g>
      {/* Whistle in Mouth */}
      <rect x="44" y="62" width="16" height="8" rx="2" fill="#CBD5E1" stroke="#000" strokeWidth="2" />
      <circle cx="58" cy="66" r="4" fill="#94A3B8" stroke="#000" strokeWidth="2" />
      {/* Digital VAR Monocle / Glasses */}
      <rect x="22" y="36" width="24" height="16" rx="4" fill="#06D6A0" stroke="#000" strokeWidth="2.5" />
      <rect x="54" y="36" width="24" height="16" rx="4" fill="#06D6A0" stroke="#000" strokeWidth="2.5" />
      <line x1="46" y1="44" x2="54" y2="44" stroke="#000" strokeWidth="3" />
      <text x="34" y="48" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#000">V</text>
      <text x="66" y="48" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#000">AR</text>
      {/* Glowing Yellow VAR Card held up */}
      <rect x="68" y="14" width="22" height="30" rx="3" fill="#FFE600" stroke="#000" strokeWidth="2.5" transform="rotate(12 68 14)" />
      <text x="79" y="32" fontSize="9" fontWeight="900" textAnchor="middle" fill="#000" transform="rotate(12 68 14)">VAR</text>
    </svg>
  );
};

// 4. Hải Cẩu Bóc Phốt (Anti-Scam Otter)
export const AntiScamOtterSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#06D6A0" stroke="#000" strokeWidth="4" />
    {/* Detective Fedora Hat */}
    <ellipse cx="50" cy="24" rx="34" ry="8" fill="#78350F" stroke="#000" strokeWidth="3" />
    <path d="M26 24C26 12 36 6 50 6C64 6 74 12 74 24Z" fill="#92400E" stroke="#000" strokeWidth="3" />
    <rect x="28" y="20" width="44" height="4" fill="#000" />
    {/* Otter Face */}
    <circle cx="50" cy="54" r="28" fill="#B45309" stroke="#000" strokeWidth="3" />
    <ellipse cx="50" cy="62" rx="16" ry="12" fill="#FDE68A" stroke="#000" strokeWidth="2" />
    {/* Sunglasses */}
    <rect x="28" y="42" width="20" height="12" rx="3" fill="#000" stroke="#000" strokeWidth="2" />
    <rect x="52" y="42" width="20" height="12" rx="3" fill="#000" stroke="#000" strokeWidth="2" />
    <line x1="48" y1="46" x2="52" y2="46" stroke="#000" strokeWidth="2" />
    <line x1="32" y1="45" x2="40" y2="51" stroke="#06D6A0" strokeWidth="1.5" />
    <line x1="56" y1="45" x2="64" y2="51" stroke="#06D6A0" strokeWidth="1.5" />
    {/* Cute Otter Nose & Whiskers */}
    <polygon points="50,60 46,56 54,56" fill="#000" />
    <line x1="38" y1="62" x2="22" y2="60" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    <line x1="38" y1="65" x2="24" y2="67" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    <line x1="62" y1="62" x2="78" y2="60" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    <line x1="62" y1="65" x2="76" y2="67" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    {/* Magnifying Glass */}
    <circle cx="76" cy="74" r="12" fill="rgba(255,255,255,0.4)" stroke="#000" strokeWidth="3" />
    <line x1="84" y1="82" x2="94" y2="92" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// 5. Bồ Tát Hóng Drama (Zen Monk)
export const ZenMonkSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#7209B7" stroke="#000" strokeWidth="4" />
    {/* Golden Halo */}
    <circle cx="50" cy="34" r="26" stroke="#FFD166" strokeWidth="5" strokeDasharray="6 3" />
    {/* Shaved Monk Head */}
    <circle cx="50" cy="46" r="24" fill="#FED7AA" stroke="#000" strokeWidth="3" />
    {/* Red/Saffron Robe */}
    <path d="M26 70C26 70 34 60 50 60C66 60 74 70 74 70L80 96H20L26 70Z" fill="#EA580C" stroke="#000" strokeWidth="3" />
    {/* Peaceful Smiling Eyes ^ ^ */}
    <path d="M36 46Q42 40 46 46" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M54 46Q58 40 64 46" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Gentle Serene Smile */}
    <path d="M44 56Q50 60 56 56" stroke="#000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Popcorn Bowl held up */}
    <path d="M32 74H68L62 92H38L32 74Z" fill="#EF233C" stroke="#000" strokeWidth="2.5" />
    <circle cx="42" cy="72" r="4" fill="#FFD166" stroke="#000" strokeWidth="1.5" />
    <circle cx="50" cy="70" r="5" fill="#FFF" stroke="#000" strokeWidth="1.5" />
    <circle cx="58" cy="72" r="4" fill="#FFD166" stroke="#000" strokeWidth="1.5" />
    {/* Drama Sparkles */}
    <text x="14" y="32" fontSize="12" fill="#FFD166">✨</text>
    <text x="76" y="36" fontSize="12" fill="#FFD166">✨</text>
  </svg>
);

// 6. Seeder Lùa Gà (Chicken Feeder)
export const ChickenFeederSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#F72585" stroke="#000" strokeWidth="4" />
    {/* Shady Hoodie */}
    <path d="M22 60C20 30 32 14 50 14C68 14 80 30 78 60Z" fill="#1E293B" stroke="#000" strokeWidth="3" />
    {/* Smug Face */}
    <ellipse cx="50" cy="50" rx="20" ry="18" fill="#FBBF24" stroke="#000" strokeWidth="2.5" />
    {/* Dark Sunglasses with Dollar Signs */}
    <rect x="34" y="42" width="14" height="10" rx="2" fill="#000" stroke="#000" strokeWidth="2" />
    <text x="41" y="50" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#06D6A0">$</text>
    <rect x="52" y="42" width="14" height="10" rx="2" fill="#000" stroke="#000" strokeWidth="2" />
    <text x="59" y="50" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#06D6A0">$</text>
    <line x1="48" y1="46" x2="52" y2="46" stroke="#000" strokeWidth="2" />
    {/* Smug Grin with Gold Tooth */}
    <path d="M38 58Q50 66 62 58" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
    <rect x="52" y="58" width="4" height="4" fill="#FFD166" stroke="#000" strokeWidth="1" />
    {/* Yellow Baby Chick popping out */}
    <circle cx="20" cy="72" r="12" fill="#FDE047" stroke="#000" strokeWidth="2" />
    <polygon points="12,72 8,70 12,68" fill="#F97316" />
    <circle cx="16" cy="69" r="1.5" fill="#000" />
    {/* Corn Kernels / Crypto Bits being dropped */}
    <circle cx="68" cy="74" r="3" fill="#FFD166" stroke="#000" strokeWidth="1" />
    <circle cx="76" cy="78" r="3" fill="#FFD166" stroke="#000" strokeWidth="1" />
    <circle cx="82" cy="70" r="3" fill="#FFD166" stroke="#000" strokeWidth="1" />
  </svg>
);

// 7. Học Giả Bách Khoa (PhD Student)
export const PhdStudentSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#3A0CA3" stroke="#000" strokeWidth="4" />
    {/* Mortarboard Academic Cap */}
    <polygon points="50,10 84,22 50,34 16,22" fill="#0F172A" stroke="#000" strokeWidth="3" />
    <circle cx="50" cy="22" r="3" fill="#FFD166" />
    <path d="M80 24L84 38L88 42" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Scholar Face */}
    <circle cx="50" cy="52" r="22" fill="#FED7AA" stroke="#000" strokeWidth="3" />
    {/* Giant Spiral Spectacles (Sleep Deprived) */}
    <circle cx="40" cy="50" r="10" fill="#FFF" stroke="#000" strokeWidth="2.5" />
    <path d="M40 46A4 4 0 1 1 36 50A4 4 0 0 1 40 54" stroke="#000" strokeWidth="1.5" fill="none" />
    <circle cx="60" cy="50" r="10" fill="#FFF" stroke="#000" strokeWidth="2.5" />
    <path d="M60 46A4 4 0 1 1 56 50A4 4 0 0 1 60 54" stroke="#000" strokeWidth="1.5" fill="none" />
    <line x1="50" y1="50" x2="50" y2="50" stroke="#000" strokeWidth="3" />
    {/* Tired Under-Eye Bags */}
    <path d="M32 62Q40 65 48 62" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
    <path d="M52 62Q60 65 68 62" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
    {/* Coffee Mug labeled MLN131 */}
    <rect x="70" y="66" width="18" height="22" rx="3" fill="#E2E8F0" stroke="#000" strokeWidth="2.5" />
    <path d="M88 72H94V82H88" stroke="#000" strokeWidth="2.5" fill="none" />
    <text x="79" y="80" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#000">MLN</text>
    {/* Coffee Steam */}
    <path d="M76 62Q74 58 76 54M82 62Q80 58 82 54" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 8. Chiến Thần Tóp Tóp (Gen Z Slang Queen)
export const GenZSlangQueenSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#4CC9F0" stroke="#000" strokeWidth="4" />
    {/* Cat-Ear Gaming Headphones */}
    <polygon points="26,14 36,30 20,30" fill="#FF70A6" stroke="#000" strokeWidth="2.5" />
    <polygon points="74,14 80,30 64,30" fill="#FF70A6" stroke="#000" strokeWidth="2.5" />
    <path d="M22 36C22 18 34 14 50 14C66 14 78 18 78 36" stroke="#000" strokeWidth="4" fill="none" />
    <rect x="16" y="34" width="10" height="20" rx="5" fill="#FF70A6" stroke="#000" strokeWidth="2.5" />
    <rect x="74" y="34" width="10" height="20" rx="5" fill="#FF70A6" stroke="#000" strokeWidth="2.5" />
    {/* Face */}
    <circle cx="50" cy="52" r="24" fill="#FED7AA" stroke="#000" strokeWidth="3" />
    {/* Eyes: Wink Left Eye & Star Right Eye */}
    <path d="M34 50L44 50" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    <text x="58" y="55" fontSize="14" fill="#F72585">★</text>
    {/* Cheek Heart Sticker */}
    <text x="32" y="64" fontSize="10" fill="#EF233C">♥</text>
    {/* Boba Drink Cup */}
    <path d="M68 64H86L82 92H72L68 64Z" fill="#FDE047" stroke="#000" strokeWidth="2.5" />
    <line x1="77" y1="56" x2="77" y2="70" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" />
    <circle cx="74" cy="84" r="2.5" fill="#000" />
    <circle cx="80" cy="85" r="2.5" fill="#000" />
    <circle cx="77" cy="88" r="2.5" fill="#000" />
    {/* Playful Tongue Smile */}
    <path d="M46 64Q50 68 54 64" stroke="#000" strokeWidth="2.5" fill="none" />
    <path d="M48 65Q50 72 52 65" fill="#EF233C" stroke="#000" strokeWidth="1.5" />
  </svg>
);

// 9. Thánh Thuyết Âm Mưu (Conspiracy Theorist)
export const ConspiracyTheoristSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#4361EE" stroke="#000" strokeWidth="4" />
    {/* Tin Foil Cone Hat with Antenna */}
    <polygon points="50,14 74,40 26,40" fill="#E2E8F0" stroke="#000" strokeWidth="3" />
    <line x1="50" y1="14" x2="50" y2="2" stroke="#000" strokeWidth="3" />
    <circle cx="50" cy="2" r="3" fill="#EF233C" />
    {/* Radio Waves emitted from Antenna */}
    <path d="M42 6Q38 2 42 -2M58 6Q62 2 58 -2" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Suspicious Face */}
    <circle cx="50" cy="56" r="22" fill="#FED7AA" stroke="#000" strokeWidth="3" />
    {/* Suspicious Eyes looking right */}
    <ellipse cx="40" cy="54" rx="7" ry="8" fill="#FFF" stroke="#000" strokeWidth="2.5" />
    <circle cx="44" cy="54" r="3.5" fill="#000" />
    <ellipse cx="60" cy="54" rx="7" ry="8" fill="#FFF" stroke="#000" strokeWidth="2.5" />
    <circle cx="64" cy="54" r="3.5" fill="#000" />
    {/* Nervous Wavy Mouth */}
    <path d="M40 70Q45 68 50 70Q55 72 60 70" stroke="#000" strokeWidth="2.5" fill="none" />
    {/* Green Alien Pin on Chest */}
    <circle cx="76" cy="76" r="10" fill="#06D6A0" stroke="#000" strokeWidth="2" />
    <ellipse cx="73" cy="74" rx="2" ry="3" fill="#000" transform="rotate(-15 73 74)" />
    <ellipse cx="79" cy="74" rx="2" ry="3" fill="#000" transform="rotate(15 79 74)" />
  </svg>
);

// 10. Dân Mạng Lương Thiện (Righteous Netizen)
export const RighteousNetizenSvg: React.FC<SvgProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="46" fill="#FFB703" stroke="#000" strokeWidth="4" />
    {/* Sunburst Rays of Justice */}
    <g stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.6">
      <line x1="50" y1="6" x2="50" y2="12" />
      <line x1="82" y1="18" x2="78" y2="23" />
      <line x1="94" y1="50" x2="88" y2="50" />
      <line x1="18" y1="18" x2="22" y2="23" />
      <line x1="6" y1="50" x2="12" y2="50" />
    </g>
    {/* Golden Laurel Wreath */}
    <path d="M22 36Q18 48 24 58M78 36Q82 48 76 58" stroke="#10B981" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Happy Smiling Face */}
    <circle cx="50" cy="50" r="24" fill="#FED7AA" stroke="#000" strokeWidth="3" />
    {/* Bright Eyes with Light Glares */}
    <ellipse cx="40" cy="46" rx="5" ry="6" fill="#000" />
    <circle cx="42" cy="44" r="2" fill="#FFF" />
    <ellipse cx="60" cy="46" rx="5" ry="6" fill="#000" />
    <circle cx="62" cy="44" r="2" fill="#FFF" />
    {/* Rosy Cheeks */}
    <circle cx="34" cy="54" r="4" fill="#FF70A6" opacity="0.7" />
    <circle cx="66" cy="54" r="4" fill="#FF70A6" opacity="0.7" />
    {/* Broad Radiant Smile */}
    <path d="M38 56Q50 68 62 56" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="#FFF" />
    {/* Democratic Ballot / Thumbs Up Badge */}
    <circle cx="76" cy="74" r="12" fill="#06D6A0" stroke="#000" strokeWidth="2.5" />
    <path d="M70 74L74 78L82 70" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// ==========================================
// 2. Netizen Avatar Persona Definitions
// ==========================================

export interface NetizenAvatar {
  id: string;
  name: string;
  title: string;
  description: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  SvgComponent: React.FC<SvgProps>;
}

export const NETIZEN_AVATARS: NetizenAvatar[] = [
  {
    id: 'keyboard_warrior',
    name: 'Anh Hùng Bàn Phím',
    title: 'Gõ Phím Thành Thần',
    description: 'Tốc độ gõ 120 WPM, chuyên combat văn minh bảo vệ chân lý dân chủ.',
    emoji: '⌨️',
    bgColor: '#EF233C',
    borderColor: '#B91C1C',
    textColor: '#FFFFFF',
    SvgComponent: KeyboardWarriorSvg,
  },
  {
    id: 'grammar_police',
    name: 'Cảnh Sát Chính Tả',
    title: 'Bắt Từng Dấu Phẩy',
    description: 'Không bao giờ bỏ qua lỗi sai chính tả hay ngụy biện câu chữ.',
    emoji: '👮',
    bgColor: '#118AB2',
    borderColor: '#0C4A6E',
    textColor: '#FFFFFF',
    SvgComponent: GrammarPoliceSvg,
  },
  {
    id: 'var_inspector',
    name: 'Trọng Tài Check VAR',
    title: 'Soi Từng Khung Hình',
    description: 'Chuyên gia tra cứu dữ liệu gốc và lật tẩy bằng chứng cắt ghép.',
    emoji: '🎦',
    bgColor: '#FFD166',
    borderColor: '#CA8A04',
    textColor: '#000000',
    SvgComponent: VarInspectorSvg,
  },
  {
    id: 'anti_scam_otter',
    name: 'Hải Cẩu Bóc Phốt',
    title: 'Khắc Tinh Lừa Đảo',
    description: 'Đánh hơi mùi lừa đảo công nghệ cao và bẫy lùa gà từ xa 10km.',
    emoji: '🦦',
    bgColor: '#06D6A0',
    borderColor: '#047857',
    textColor: '#000000',
    SvgComponent: AntiScamOtterSvg,
  },
  {
    id: 'zen_monk',
    name: 'Bồ Tát Hóng Drama',
    title: 'Tâm Bất Biến Giữa Dòng Đời',
    description: 'Ăn bỏng ngô theo dõi drama, chỉ lên tiếng khi có kết luận chính thức.',
    emoji: '🍿',
    bgColor: '#7209B7',
    borderColor: '#4A044E',
    textColor: '#FFFFFF',
    SvgComponent: ZenMonkSvg,
  },
  {
    id: 'chicken_feeder',
    name: 'Seeder Lùa Gà',
    title: 'Chuyên Gia Thổi Giá',
    description: 'Bậc thầy tạo tài khoản ảo và giật tít câu tương tác bẩn.',
    emoji: '🐔',
    bgColor: '#F72585',
    borderColor: '#9D174D',
    textColor: '#FFFFFF',
    SvgComponent: ChickenFeederSvg,
  },
  {
    id: 'phd_student',
    name: 'Học Giả Bách Khoa',
    title: 'Luận Văn 300 Trang',
    description: 'Trích dẫn nguyên văn giáo trình MLN131 khi tranh luận trên mạng.',
    emoji: '☕',
    bgColor: '#3A0CA3',
    borderColor: '#1E1B4B',
    textColor: '#FFFFFF',
    SvgComponent: PhdStudentSvg,
  },
  {
    id: 'genz_slang_queen',
    name: 'Chiến Thần Tóp Tóp',
    title: 'Nữ Hoàng Xu Hướng',
    description: 'Giao tiếp bằng tiếng lóng Gen Z, bắt trend siêu tốc không trượt phát nào.',
    emoji: '🧋',
    bgColor: '#4CC9F0',
    borderColor: '#0284C7',
    textColor: '#000000',
    SvgComponent: GenZSlangQueenSvg,
  },
  {
    id: 'conspiracy_theorist',
    name: 'Thánh Thuyết Âm Mưu',
    title: 'Mọi Thứ Đều Được Sắp Đặt',
    description: 'Đội mũ giấy bạc bắt sóng vệ tinh, nghi ngờ mọi thuật toán mạng.',
    emoji: '🛸',
    bgColor: '#4361EE',
    borderColor: '#1D4ED8',
    textColor: '#FFFFFF',
    SvgComponent: ConspiracyTheoristSvg,
  },
  {
    id: 'righteous_netizen',
    name: 'Dân Mạng Lương Thiện',
    title: 'Ngọn Hải Đăng Công Lý',
    description: 'Biểu tượng tinh thần trách nhiệm công dân số và phản biện lành mạnh.',
    emoji: '✨',
    bgColor: '#FFB703',
    borderColor: '#B45309',
    textColor: '#000000',
    SvgComponent: RighteousNetizenSvg,
  },
];

// Helper to look up avatar by ID
export function getAvatarById(id: string): NetizenAvatar {
  const found = NETIZEN_AVATARS.find((a) => a.id === id);
  return found || NETIZEN_AVATARS[0];
}

// Helper to get random avatar
export function getRandomAvatar(): NetizenAvatar {
  const idx = Math.floor(Math.random() * NETIZEN_AVATARS.length);
  return NETIZEN_AVATARS[idx];
}
