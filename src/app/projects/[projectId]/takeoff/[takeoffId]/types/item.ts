/* eslint-disable @typescript-eslint/no-explicit-any */
export type OnSettingsChange = React.Dispatch<React.SetStateAction<Item>>;

export type FooterProps = {
  item?: any;
  handleSelectChange?: any;
  index?: number;
  isFormDisabled?: boolean;
  status?: LineSelectorStatus;
};

export type LineSelectorStatus = "enabled" | "disabled" | "upload";

export type LineSelectorProps = {
  productLine: string | null;
  onSelectChange: (
    value: string | number | null,
    index: number,
    field: string,
    units?: boolean,
    $unit_index?: number
  ) => void;
  index: number;
  lineSelectorStatus: LineSelectorStatus;
};

export type ProductLine = "bellavista" | "spazio";

export type Item = {
  isWindow: boolean;
  product_line: ProductLine;
  configuration: {
    type: string;
    open: string;
  };
  dimensions: {
    width: number;
    height: number;
  };
  dividers: {
    muntin: number | null;
  };
  frame: {
    line: string;
    material: string;
    finish: string;
    glazing_beads: string;
  };
  glass: {
    brand: string;
    glass_type: string;
    coating: string;
    arrangement: string;
  };
  hardware: {
    style: string;
    finish: string;
    has_fixions: boolean;
  };
  installation: {
    method: string;
    location: string;
    glazed: boolean;
  };
};

export type QuotiiFromApi = {
  id: string | null;
  name: string | null;
  latii_project_id: string | null;
  dealer_project_id: number | null;
  linked_quote_id: string | null;
  previous_quote_id: string | null;
  revision_group_id: string | null;
  process_state: string | null;
  is_latii_owner: boolean | null;
  type_of_data_source: number | null;
  status: number | null;
  version: number | null;
  is_primary: number | null;
  item_count: number | null;
  unit_count: number | null;
  total_price: number | null;
  quote_discount_amount: number | null;
  product_price: number | null;
  price_sqft: number | null;
  custom_fee: number | null;
  max_custom_fee: number | null;
  transportation_fee: number | null;
  min_product_price: number | null;
  max_product_price: number | null;
  gmv: number | null;
  vendor_cost: number | null;
  mark_up: number | null;
  take_rate: number | null;
  total_visible_discount: number | null;
  total_negative_discount: number | null;
  total_positive_discount: number | null;
  latii_mark_up: number | null;
  latii_aluminum_mark_up: number | null;
  latii_steel_mark_up: number | null;
  latii_aluminum_take_rate: number | null;
  latii_steel_take_rate: number | null;
  custom_tariff: number | null;
  custom_max_tariff: number | null;
  shipping_packing_cost: number | null;
  exchange_rate_euro: number | null;
  exchange_rate_mxn: number | null;
  exchange_rate_mad: number | null;
  exchange_rate_try: number | null;
  pdf_add_discount_amount: number | null;
  pdf_add_discount_percent: number | null;
  create_time: string | null;
  create_user: string | null;
  update_time: string | null;
  update_user: string | null;
  client_id: string | null;
  items: ItemFromApi[];
};

type Unit = {
  id: string | null;
  line: number | null;
  product: SelectField | null;
  product_type: SelectField | null;
  operability: SelectField | null;
  is_sliding_door: boolean | null;
  is_sliding_window: boolean | null;
  is_folding_door: boolean | null;
  max_width: number | null;
  max_height: number | null;
  width_input: number | null;
  height_input: number | null;
  position_x: number | null;
  position_y: number | null;
  is_have_hardware_section: boolean | null;
  hardware_handle_style: SelectField | null;
  hardware_handle_latii_style: SelectField | null;
  hardware_material: SelectField | null;
  hardware_finish: SelectField | null;
  hardware_finish_color: unknown[] | null;
  hardware_color_input: string | null;
  hardware_key_yes_no: SelectField | null;
  hardware_keyed_aliked_yes_no: SelectField | null;
  hardware_fixion: SelectField | null;
  divider_data: unknown | null;
  canvas_data: unknown | null;
  drawing_image_url: string | null;
  shape: unknown | null;
  shape_data: unknown | null;
};

type ItemFromApi = {
  id: string | null;
  is_add: boolean | null;
  is_page_add: boolean | null;
  is_page_edit: boolean | null;
  is_page_delete: boolean | null;
  line: number | null;
  is_ui_expanded: boolean | null;
  item_type: SelectField | null;
  is_system: boolean | null;
  image: {
    current_selected_mode: string | null;
  } | null;
  frame_material: SelectField | null;
  profile: SelectField | null;
  material: SelectField | null;
  finish_method: SelectField | null;
  color: string | null;
  color_input: string | null;
  glass_brand: SelectField | null;
  glass_coating: SelectField | null;
  glass_type: SelectField | null;
  glass_arrangement: SelectField | null;
  glass_air_type: SelectField | null;
  casting_style: SelectField | null;
  sdl_dividers_arrangement: SelectField | null;
  tdl_dividers_arrangement: SelectField | null;
  is_have_sdl: boolean | null;
  is_have_tdl: boolean | null;
  installation_method: SelectField | null;
  installation_glazed: SelectField | null;
  installation_location: string | null;
  installation_addition_note: string | null;
  installation_nailing_fin: SelectField | null;
  quantity: number | null;
  width_input: number | null;
  height_input: number | null;
  area: number | null;
  item_price: number | null;
  item_price_min: number | null;
  item_price_max: number | null;
  price_sqft: number | null;
  item_total_price: number | null;
  ref_number: number | null;
  item_price_min_ref_number: number | null;
  item_price_max_ref_number: number | null;
  item_vendor_cost_ref_number: number | null;
  is_changed: boolean | null;
  item_vendor_cost: number | null;
  item_vendor_cost_base: number | null;
  item_vendor_cost_finish: number | null;
  item_vendor_cost_glass: number | null;
  item_vendor_cost_muntin: number | null;
  item_vendor_cost_other: number | null;
  item_mark_up: number | null;
  item_mark_up_percent: number | null;
  canvas_data: unknown | null;
  dimension_data: unknown | null;
  is_disabled_profile_line: boolean | null;
  is_completed_profile_line: boolean | null;
  is_disabled_glazing_bead: boolean | null;
  is_completed_glazing_bead: boolean | null;
  is_disabled_finish: boolean | null;
  is_completed_finish: boolean | null;
  is_disabled_glass: boolean | null;
  is_completed_glass: boolean | null;
  is_disabled_hardware: boolean | null;
  is_completed_hardware: boolean | null;
  is_disabled_installation: boolean | null;
  is_completed_installation: boolean | null;
  profile_line: SelectField | null;
  glass_style: SelectField | null;
  glass_specification: SelectField | null;
  current_ui_section_step: number | null;
  units: Unit[] | null;
};

type Option = {
  value: string;
  text: string;
  details: string | null;
};

type SelectField<T = string | number | null> = {
  options: Option[] | null;
  selected_value: T;
  disabled: boolean | null;
};

export type HandleMultipleChanges = (
  index: number,
  changeInfos: Array<{
    value: any;
    field: string;
    units?: boolean;
    $unit_index?: number;
  }>
) => void;
