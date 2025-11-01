import cashierImg from '@/assets/job-cashier.jpg';
import salespersonImg from '@/assets/job-salesperson.jpg';
import deliveryImg from '@/assets/job-delivery.jpg';
import cookImg from '@/assets/job-cook.jpg';
import baristaImg from '@/assets/job-barista.jpg';
import waiterImg from '@/assets/job-waiter.jpg';
import receptionistImg from '@/assets/job-receptionist.jpg';
import managerImg from '@/assets/job-manager.jpg';

export const jobImages: Record<string, string> = {
  'Cashier': cashierImg,
  'Sales Associate': salespersonImg,
  'Salesperson': salespersonImg,
  'Delivery Person': deliveryImg,
  'Delivery Driver': deliveryImg,
  'Cook': cookImg,
  'Chef': cookImg,
  'Kitchen Helper': cookImg,
  'Barista': baristaImg,
  'Waiter': waiterImg,
  'Server': waiterImg,
  'Receptionist': receptionistImg,
  'Front Desk': receptionistImg,
  'Store Manager': managerImg,
  'Shop Manager': managerImg,
  'Assistant Manager': managerImg,
};

export const getJobImage = (title: string): string => {
  for (const [key, image] of Object.entries(jobImages)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return image;
    }
  }
  return cashierImg; // Default fallback
};
