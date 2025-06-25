
export interface MenuItem {
  id?: number;
  label?: string;
  icon?: string;
  link?: string;
  expanded?: boolean;
  subItems?: MenuItem[];
  isTitle?: boolean;
  badge?: any;
  parentId?: number;
  module?: string;
}
