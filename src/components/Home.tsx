import React from 'react';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { ChevronRight, Award, ShieldCheck, Users, Globe, ArrowRight, TrendingUp, HeartHandshake, GraduationCap } from 'lucide-react';

interface HomeProps {
  onApply: () => void;
}

// ─── Reusable: Fade-up reveal on scroll ─────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger wrapper ─────────────────────────────────────────────────────────
function StaggerGroup({ children, className = '', staggerDelay = 0.12 }: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: staggerDelay } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
}

// ─── Floating satellite badge ────────────────────────────────────────────────
function FloatingBadge({
  icon,
  label,
  sub,
  className = '',
  animClass = 'animate-float-y',
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  className?: string;
  animClass?: string;
}) {
  return (
    <div
      className={`glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl ${animClass} ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
        {icon}
      </div>
      <div>
        <div className="text-white text-sm font-bold leading-tight">{label}</div>
        <div className="text-white/60 text-xs">{sub}</div>
      </div>
    </div>
  );
}

// ─── Partner marquee data ────────────────────────────────────────────────────
const PARTNERS = [
  'MDRT 2025', 'Top Advisor', 'PRU Academy', 'IFA Global', 'Asia Insurance',
  'Globe Life', 'FWD Group', 'Hanwha Life', 'Manulife VN', 'AIA Vietnam',
];

export default function Home({ onApply }: HomeProps) {
  return (
    <div className="space-y-28 mb-16">

      {/* ── HERO SECTION ── */}
      <section className="relative h-[580px] rounded-[2.5rem] overflow-hidden flex items-center shadow-2xl">

        {/* Background image */}
        <img
          src="https://picsum.photos/seed/prudential_new/1920/1080"
          alt="Prudential Office"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Deep gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/65 to-blue-900/20" />

        {/* Animated glow blob */}
        <div
          className="absolute top-[-80px] right-[10%] w-[500px] h-[500px] rounded-full opacity-30 animate-blob pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(237,27,46,0.6) 0%, transparent 70%)' }}
        />

        {/* ─ Floating satellite badges ─ */}
        <FloatingBadge
          icon={<TrendingUp size={18} />}
          label="Thu nhập không trần"
          sub="100% Hoa hồng"
          className="absolute top-10 right-[18%] hidden md:flex"
          animClass="animate-float-y"
        />
        <FloatingBadge
          icon={<GraduationCap size={18} />}
          label="PRU Academy"
          sub="Đào tạo chuẩn quốc tế"
          className="absolute bottom-16 right-[8%] hidden md:flex"
          animClass="animate-float-y-reverse"
        />
        <FloatingBadge
          icon="🏆"
          label="MDRT 2024"
          sub="Top 1 toàn cầu"
          className="absolute top-[40%] right-[30%] hidden lg:flex"
          animClass="animate-float-x"
        />

        {/* ─ Copy ─ */}
        <div className="relative z-10 px-8 md:px-16 max-w-3xl text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-red-600/25 border border-red-400/30 text-red-200 text-sm font-bold tracking-wider mb-6">
              TUYỂN DỤNG 2026
            </span>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-[1.15]">
              Kiến tạo di sản <br />
              cùng{' '}
              <span className="text-gradient-brand">Prudential</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-xl font-medium leading-relaxed">
              Gia nhập đội ngũ Chuyên viên Tư vấn Tài chính xuất sắc nhất.
              Cùng chúng tôi bảo vệ sự phồn vinh của hàng triệu gia đình Việt Nam.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={onApply}
                whileHover={{ scale: 1.03, translateY: -2 }}
                whileTap={{ scale: 0.97 }}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_12px_25px_-8px_rgba(237,27,46,0.55)]"
              >
                Ứng tuyển ngay <ChevronRight size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="glass-panel text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                Tìm hiểu thêm
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PARTNER MARQUEE ── */}
      <FadeUp>
        <div className="overflow-hidden relative py-6">
          <div className="absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
          <div className="flex animate-marquee-left whitespace-nowrap gap-0">
            {[...PARTNERS, ...PARTNERS].map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 mx-8 text-neutral-400 font-bold text-sm tracking-widest uppercase"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ── TRUST & STATS SECTION ── */}
      <section className="grid lg:grid-cols-2 gap-16 items-center">

        <FadeUp>
          <h2 className="text-4xl font-black mb-6 text-neutral-900 tracking-tight">
            Niềm tin vững chắc,<br />
            <span className="text-blue-900">Cam kết dài lâu.</span>
          </h2>
          <div className="space-y-5 text-neutral-600 text-lg leading-relaxed">
            <p>
              Với hơn <strong className="text-blue-900">20 năm</strong> phát triển bền vững tại Việt Nam, Prudential tự hào là điểm tựa tài chính tin cậy cho hơn 1.6 triệu khách hàng.
            </p>
            <p>
              Dành cho ứng viên, chúng tôi mở ra lộ trình phát triển không giới hạn với hệ thống đào tạo chuẩn quốc tế và thu nhập không trần.
            </p>
          </div>
        </FadeUp>

        <StaggerGroup className="grid grid-cols-2 gap-6" staggerDelay={0.1}>
          {[
            { icon: <Award size={28} />, value: 'Top 1', label: 'Bảo hiểm nhân thọ', color: 'red', offset: '' },
            { icon: <Users size={28} />, value: '200K+', label: 'Tư vấn viên', color: 'blue', offset: 'mt-8' },
            { icon: <Globe size={28} />, value: '350+', label: 'Văn phòng đại diện', color: 'blue', offset: '-mt-8' },
            { icon: <ShieldCheck size={28} />, value: '1.6Tr+', label: 'Khách hàng tin chọn', color: 'red', offset: '' },
          ].map((item) => (
            <motion.div
              key={item.value}
              whileHover={{ translateY: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.3 }}
              className={`bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 text-center ${item.offset}`}
            >
              <div className={`w-14 h-14 ${item.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-900'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                {item.icon}
              </div>
              <h3 className="font-black text-2xl text-neutral-900 mb-1">{item.value}</h3>
              <p className="text-sm text-neutral-500 font-medium">{item.label}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </section>

      {/* ── WHY JOIN US ── */}
      <section className="bg-white border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] p-10 md:p-16">
        <FadeUp className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
          <div>
            <h2 className="text-4xl font-black text-neutral-900 mb-3 tracking-tight">
              Đặc quyền nghề nghiệp
            </h2>
            <p className="text-neutral-500 text-lg">Chỉ có tại môi trường Prudential Việt Nam</p>
          </div>
          <motion.button
            onClick={onApply}
            whileHover={{ gap: '1.25rem' }}
            className="text-red-600 font-bold flex items-center gap-3 transition-all group shrink-0"
          >
            Gia nhập ngay <ArrowRight size={20} />
          </motion.button>
        </FadeUp>

        <StaggerGroup className="grid md:grid-cols-3 gap-8" staggerDelay={0.13}>
          {[
            {
              title: 'Môi trường quốc tế',
              desc: '100% công nghệ số, trụ sở hiện đại và mạng lưới chi nhánh năng động trên cả nước.',
              icon: '🏢',
              glow: 'hover:glow-blue',
            },
            {
              title: 'Bứt phá thu nhập',
              desc: 'Chính sách hoa hồng cạnh tranh nhất thị trường, không giới hạn trần thưởng kinh doanh.',
              icon: '💎',
              glow: 'hover:glow-red',
            },
            {
              title: 'Đào tạo đặc quyền',
              desc: 'Hệ thống huấn luyện PRU-Academy với mô hình mentoring từ các chuyên gia MDRT toàn cầu.',
              icon: '🎓',
              glow: 'hover:glow-blue',
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ translateY: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`bg-slate-50 p-8 rounded-3xl border border-neutral-100 hover:border-red-200 hover:shadow-xl transition-all cursor-default group`}
            >
              <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform origin-left duration-300">
                {item.icon}
              </div>
              <h3 className="font-black text-xl mb-3 text-neutral-900 group-hover:text-red-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </section>

      {/* ── CTA BANNER ── */}
      <FadeUp>
        <div className="relative rounded-[2.5rem] overflow-hidden bg-blue-900 p-12 md:p-20 text-center">
          {/* Glow orbs */}
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full animate-blob pointer-events-none opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(237,27,46,0.5) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full animate-blob pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(99,179,237,0.4) 0%, transparent 70%)' }} />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
              Sẵn sàng bắt đầu <span className="text-gradient-brand">hành trình</span> của bạn?
            </h2>
            <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto">
              Điền hồ sơ ngay hôm nay và nhận phản hồi trong vòng 24 giờ làm việc.
            </p>
            <motion.button
              onClick={onApply}
              whileHover={{ scale: 1.05, translateY: -3 }}
              whileTap={{ scale: 0.97 }}
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-3 mx-auto w-fit shadow-[0_16px_40px_-12px_rgba(237,27,46,0.6)] transition-colors"
            >
              Ứng tuyển ngay <ChevronRight size={22} />
            </motion.button>
          </div>
        </div>
      </FadeUp>

    </div>
  );
}
