declare module "react-day-picker" {
  export const DayPicker: React.ComponentType<any>;
}

declare module "embla-carousel-react" {
  export type UseEmblaCarouselType = [React.RefCallback<HTMLElement>, any];
  export default function useEmblaCarousel(options?: any, plugins?: any): UseEmblaCarouselType;
}

declare module "js-cookie";
