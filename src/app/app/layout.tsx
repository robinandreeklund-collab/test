import TabBar from '@/components/TabBar';
import PhoneFrame from '@/components/PhoneFrame';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhoneFrame>
      {children}
      <TabBar />
    </PhoneFrame>
  );
}
