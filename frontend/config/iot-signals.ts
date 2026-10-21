export const iotSignals = {
  Energy: [
    ["total_power_kw", "Total power", "kW"],
    ["energy_kwh_per_ton", "Energy intensity", "kWh/ton"]
  ],
  Kiln: [
    ["kiln_inlet_temp_c", "Kiln inlet temperature", "°C"],
    ["kiln_outlet_temp_c", "Kiln outlet temperature", "°C"],
    ["preheater_stage1_temp_c", "Preheater stage 1", "°C"],
    ["preheater_stage2_temp_c", "Preheater stage 2", "°C"],
    ["preheater_stage3_temp_c", "Preheater stage 3", "°C"],
    ["preheater_stage4_temp_c", "Preheater stage 4", "°C"],
    ["clinker_temp_c", "Clinker temperature", "°C"]
  ],
  Fans: [
    ["id_fan_speed_pct", "ID fan speed", "%"],
    ["id_fan_power_kw", "ID fan power", "kW"],
    ["pa_fan_speed_pct", "PA fan speed", "%"],
    ["sa_fan_speed_pct", "SA fan speed", "%"]
  ],
  Mills: [
    ["raw_mill_power_kw", "Raw mill power", "kW"],
    ["raw_mill_load_pct", "Raw mill load", "%"],
    ["finish_mill_power_kw", "Finish mill power", "kW"],
    ["finish_mill_load_pct", "Finish mill load", "%"],
    ["separator_speed_pct", "Separator speed", "%"]
  ],
  Dust: [
    ["bag_filter_dp_kpa", "Bag filter differential pressure", "kPa"],
    ["bag_reverse_cycle_s", "Bag reverse cycle", "s"],
    ["esp_load_pct", "ESP load", "%"],
    ["stack_temp_c", "Stack temperature", "°C"],
    ["stack_pm_mg_per_nm3", "Stack particulate matter", "mg/Nm³"],
    ["stack_opacity_pct", "Stack opacity", "%"]
  ],
  Process: [
    ["feed_rate_tph", "Feed rate", "ton/h"],
    ["alt_fuel_pct", "Alternative fuel", "%"],
    ["coal_feed_rate_tph", "Coal feed rate", "ton/h"],
    ["o2_pct", "Oxygen", "%"]
  ]
} as const;

export const iotSignalUnits = Object.fromEntries(
  Object.values(iotSignals).flat().map(([key, , unit]) => [key, unit])
) as Record<string, string>;
