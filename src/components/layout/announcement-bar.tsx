import { getShopSettings } from '@/lib/settings';
import { AnnouncementBarClient } from './announcement-bar-client';

export async function AnnouncementBar() {
  const { banner } = await getShopSettings();
  return (
    <AnnouncementBarClient
      messages={banner.messages}
      showCountdown={banner.showCountdown}
      cutoffHour={banner.cutoffHour}
    />
  );
}
