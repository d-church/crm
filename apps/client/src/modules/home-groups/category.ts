import { HomeGroupCategory, type HomeGroupCategory as HomeGroupCategoryValue } from '@/services';

export const HOME_GROUP_CATEGORIES: HomeGroupCategoryValue[] = [
  HomeGroupCategory.YOUTH,
  HomeGroupCategory.FAMILY,
  HomeGroupCategory.SENIORS,
  HomeGroupCategory.FRIENDS,
];

export const HOME_GROUP_CATEGORY_LABELS: Record<HomeGroupCategoryValue, string> = {
  [HomeGroupCategory.YOUTH]: 'D.Youth',
  [HomeGroupCategory.FAMILY]: 'D.Family',
  [HomeGroupCategory.SENIORS]: 'D.Seniors',
  [HomeGroupCategory.FRIENDS]: 'D.Friends',
};
