/**
 * Generates src/data/products.json from the raw catalog below.
 *
 * Run with:  npm run generate:products
 *
 * - Slugs are auto-generated from names (parenthetical content is dropped)
 *   when a `slug` is not given.
 * - Items start with just a name; add optional fields (specs, applications,
 *   variants, images, datasheet, featured, tags) via the ENHANCEMENTS map
 *   keyed by "categorySlug/subcategorySlug/Item Name".
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* ── Helpers ───────────────────────────────────────────────────────── */

function slugify(input: string): string {
  return input
    .replace(/\([^)]*\)/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface RawItem {
  name: string;
  slug?: string;
}
interface RawSubcategory {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  menuLabel?: string;
  items: (RawItem | string)[];
}
interface RawCategory {
  name: string;
  slug: string;
  icon: string;
  image?: string;
  description: string;
  menuLabel?: string;
  subcategories: RawSubcategory[];
}
interface Enhancement {
  shortDescription?: string;
  description?: string;
  specs?: Record<string, string>;
  variants?: string[];
  applications?: string[];
  datasheet?: string;
  featured?: boolean;
  tags?: string[];
}

/* ── Catalog (Section 9 of context.md) ─────────────────────────────── */

const CATALOG: RawCategory[] = [
  {
    name: 'Chemicals',
    slug: 'chemicals',
    icon: 'flask-conical',
    description: 'Industrial chemicals, solvents, water treatment and cleaning chemicals — documented grades with batch traceability.',
    subcategories: [
      {
        name: 'Industrial Chemicals',
        items: [
          'Sodium Hydroxide (Caustic Soda)', 'Hydrochloric Acid', 'Sulfuric Acid', 'Nitric Acid',
          'Phosphoric Acid', 'Acetic Acid', 'Citric Acid', 'Sodium Carbonate', 'Sodium Bicarbonate',
          'Calcium Chloride', 'Ammonium Chloride', 'Potassium Hydroxide',
        ],
      },
      {
        name: 'Solvents',
        items: ['Acetone', 'Isopropyl Alcohol (IPA)', 'Methanol', 'Ethanol', 'Toluene', 'Xylene', 'MEK', 'MIBK'],
      },
      {
        name: 'Water Treatment Chemicals',
        items: [
          'Alum', 'Ferric Chloride', 'Poly Aluminium Chloride (PAC)', 'Sodium Hypochlorite',
          'Antiscalants', 'Biocides', 'Coagulants', 'Flocculants',
        ],
      },
      {
        name: 'Cleaning & Degreasing Chemicals',
        menuLabel: 'Cleaning & Degreasing',
        items: ['Industrial Degreasers', 'Chemical Cleaners', 'Rust Removers', 'Descaling Chemicals', 'Metal Cleaners'],
      },
    ],
  },
  {
    name: 'Paints',
    slug: 'paints',
    icon: 'paint-bucket',
    description: 'Industrial and protective paints: enamels, epoxies, primers and coatings engineered for plant environments.',
    subcategories: [
      {
        name: 'Industrial Paints',
        items: [
          'Enamel Paint', 'Alkyd Paint', 'Epoxy Paint', 'Polyurethane Paint', 'Acrylic Paint',
          'Synthetic Paint', 'Machinery Paint', 'Structural Steel Paint',
        ],
      },
      {
        name: 'Primers',
        items: [
          'Red Oxide Primer', 'Zinc Chromate Primer', 'Zinc Phosphate Primer', 'Epoxy Primer',
          'Metal Primer', 'Anti-Corrosion Primer',
        ],
      },
      {
        name: 'Protective Coatings',
        items: [
          'Anti-Corrosion Coating', 'Heat Resistant Coating', 'Chemical Resistant Coating',
          'Abrasion Resistant Coating', 'Waterproof Coating',
        ],
      },
    ],
  },
  {
    name: 'Special Paints & Coatings',
    slug: 'special-paints-coatings',
    icon: 'flame',
    description: 'High-temperature and special-purpose coatings: furnace paints, fire retardants, anti-static and metal coatings.',
    subcategories: [
      {
        name: 'High Temperature Paints',
        items: ['Heat Resistant Paint', 'Stove Paint', 'Furnace Paint', 'Exhaust Paint', 'High Temperature Coating'],
      },
      {
        name: 'Special Purpose Coatings',
        items: [
          'Fire Retardant Paint', 'Food Grade Coating', 'Chemical Resistant Coating', 'Anti-Slip Coating',
          'Anti-Static Coating', 'Electrical Insulating Paint',
        ],
      },
      {
        name: 'Metal Coatings',
        items: ['Zinc Coating', 'Galvanizing Paint', 'Aluminum Paint', 'Anti-Rust Coating'],
      },
    ],
  },
  {
    name: 'Glassware',
    slug: 'glassware',
    icon: 'glass-water',
    description: 'Industrial glass and sight-glass products: borosilicate components, sheets, tubes and assemblies.',
    subcategories: [
      {
        name: 'Industrial Glass',
        items: [
          'Borosilicate Glass', 'Tempered Glass', 'Toughened Glass', 'Heat Resistant Glass',
          'Chemical Resistant Glass', 'Sight Glass',
        ],
      },
      {
        name: 'Industrial Glass Components',
        items: ['Glass Tubes', 'Glass Sheets', 'Glass Rods', 'Glass Plates', 'Glass Discs', 'Glass Windows'],
      },
      {
        name: 'Sight Glass Products',
        items: ['Sight Glass Assemblies', 'Sight Glass Covers', 'Sight Glass Gaskets', 'Sight Glass Protectors'],
      },
    ],
  },
  {
    name: 'Fasteners',
    slug: 'fasteners',
    icon: 'bolt',
    description: 'Complete fastener range in standard and high-tensile grades: bolts, nuts, washers, screws, studs and anchors.',
    subcategories: [
      { name: 'Bolts', items: ['Hex Bolts', 'Allen Bolts', 'Carriage Bolts', 'U-Bolts', 'Eye Bolts', 'Anchor Bolts'] },
      { name: 'Nuts', items: ['Hex Nuts', 'Lock Nuts', 'Nylon Lock Nuts', 'Wing Nuts', 'Dome Nuts', 'Flange Nuts'] },
      { name: 'Washers', items: ['Flat Washers', 'Spring Washers', 'Lock Washers', 'Serrated Washers', 'Sealing Washers'] },
      {
        name: 'Screws',
        items: ['Machine Screws', 'Self-Tapping Screws', 'Self-Drilling Screws', 'Set Screws', 'Countersunk Screws'],
      },
      { name: 'Other Fasteners', items: ['Studs', 'Threaded Rods', 'Rivets', 'Pins', 'Circlips', 'Anchors'] },
    ],
  },
  {
    name: 'Putties',
    slug: 'putties',
    icon: 'hammer',
    description: 'Metal, repair and surface putties for rebuilding, sealing and finishing under industrial conditions.',
    subcategories: [
      { name: 'Metal Putties', items: ['Metal Repair Putty', 'Steel Putty', 'Aluminum Putty', 'Stainless Steel Putty'] },
      {
        name: 'Industrial Repair Putties',
        items: ['Epoxy Putty', 'Pipe Repair Putty', 'Machinery Repair Putty', 'Chemical Resistant Putty', 'High Temperature Putty'],
      },
      { name: 'Surface Putties', items: ['Wood Putty', 'Wall Putty', 'Automotive Putty', 'Fiberglass Putty'] },
    ],
  },
  {
    name: 'Laboratory Glassware & Industrial Instruments',
    slug: 'lab-instruments',
    icon: 'microscope',
    menuLabel: 'Lab & Instruments',
    description: 'Laboratory glassware, lab equipment, measuring instruments and industrial process instrumentation.',
    subcategories: [
      {
        name: 'Laboratory Glassware',
        items: [
          'Beakers', 'Flasks', 'Test Tubes', 'Measuring Cylinders', 'Pipettes', 'Burettes', 'Funnels',
          'Reagent Bottles', 'Watch Glasses', 'Petri Dishes',
        ],
      },
      {
        name: 'Laboratory Equipment',
        items: ['Hot Plates', 'Laboratory Ovens', 'Magnetic Stirrers', 'Laboratory Balances', 'Centrifuges', 'Water Baths', 'Heating Mantles'],
      },
      {
        name: 'Measuring Instruments',
        items: ['Pressure Gauges', 'Temperature Gauges', 'Thermometers', 'Flow Meters', 'Level Indicators', 'Vacuum Gauges', 'pH Meters'],
      },
      {
        name: 'Industrial Instruments',
        items: ['Pressure Transmitters', 'Temperature Sensors', 'Flow Sensors', 'Level Sensors', 'Digital Controllers', 'Process Indicators'],
      },
    ],
  },
  {
    name: 'Stainless Steel Sheets & Rods',
    slug: 'stainless-steel',
    icon: 'layers',
    menuLabel: 'Stainless Steel',
    description: 'Stainless steel sheets, rods and forms in 304/316/321/310/430 grades with all standard mill finishes.',
    subcategories: [
      { name: 'Stainless Steel Sheets', items: ['SS 304 Sheets', 'SS 316 Sheets', 'SS 321 Sheets', 'SS 310 Sheets', 'SS 430 Sheets'] },
      { name: 'Sheet Finishes', items: ['2B Finish', 'BA Finish', 'No. 4 Finish', 'Mirror Finish', 'Hairline Finish'] },
      { name: 'Stainless Steel Rods', items: ['Round Bars', 'Square Bars', 'Hex Bars', 'Flat Bars'] },
      {
        name: 'Stainless Steel Forms',
        items: ['Stainless Steel Plates', 'Stainless Steel Strips', 'Stainless Steel Tubes', 'Stainless Steel Pipes'],
      },
    ],
  },
  {
    name: 'PTFE Bars & Rods',
    slug: 'ptfe',
    icon: 'cylinder',
    menuLabel: 'PTFE',
    description: 'Virgin and filled PTFE products: rods, sheets, tubes, gaskets, seals and machined components.',
    subcategories: [
      {
        name: 'PTFE Products',
        items: ['PTFE Rods', 'PTFE Bars', 'PTFE Sheets', 'PTFE Plates', 'PTFE Tubes', 'PTFE Bushes', 'PTFE Rings'],
      },
      { name: 'PTFE Components', items: ['PTFE Gaskets', 'PTFE Seals', 'PTFE Washers', 'PTFE O-Rings', 'PTFE Insulators'] },
      {
        name: 'Special PTFE',
        items: ['Virgin PTFE', 'Filled PTFE', 'Glass-Filled PTFE', 'Carbon-Filled PTFE', 'Graphite-Filled PTFE'],
      },
    ],
  },
  {
    name: 'Composite Materials',
    slug: 'composites',
    icon: 'hexagon',
    description: 'Fiberglass, carbon fiber and FRP/GRP composites: sheets, tubes, fabrics and structural components.',
    subcategories: [
      {
        name: 'Fiberglass Materials',
        items: ['Fiberglass Sheets', 'Fiberglass Rods', 'Fiberglass Tubes', 'Fiberglass Fabric', 'Fiberglass Mat'],
      },
      { name: 'Carbon Fiber', items: ['Carbon Fiber Sheets', 'Carbon Fiber Rods', 'Carbon Fiber Tubes', 'Carbon Fiber Fabric'] },
      { name: 'Composite Sheets & Panels', items: ['FRP Sheets', 'GRP Sheets', 'Composite Panels', 'Insulation Boards'] },
      {
        name: 'Composite Components',
        items: ['Composite Bushes', 'Composite Bearings', 'Composite Profiles', 'Composite Structural Parts'],
      },
    ],
  },
  {
    name: 'Steel Balls',
    slug: 'steel-balls',
    icon: 'circle-dot',
    description: 'Precision steel balls for bearings, valves and grinding media — chrome, stainless and carbon steel, all standard sizes.',
    subcategories: [
      { name: 'Bearing Balls', items: ['Chrome Steel Balls', 'Stainless Steel Balls', 'Carbon Steel Balls'] },
      { name: 'Industrial Balls', items: ['Grinding Balls', 'Precision Steel Balls', 'Hardened Steel Balls', 'Mild Steel Balls'] },
      { name: 'Applications', items: ['Bearing Balls', 'Valve Balls', 'Grinding Media', 'Industrial Grinding Balls'] },
      { name: 'Sizes', items: ['Small Diameter Balls', 'Medium Diameter Balls', 'Large Diameter Balls', 'Custom Size Balls'] },
    ],
  },
  {
    name: 'Loctite & Adhesives',
    slug: 'adhesives',
    icon: 'droplets',
    menuLabel: 'Adhesives',
    description: 'Threadlockers, structural adhesives, industrial glues and sealants for assembly and maintenance.',
    subcategories: [
      {
        name: 'Threadlockers',
        items: ['Threadlocker Low Strength', 'Threadlocker Medium Strength', 'Threadlocker High Strength', 'Thread Sealant'],
      },
      {
        name: 'Structural Adhesives',
        items: ['Epoxy Adhesives', 'Acrylic Adhesives', 'Anaerobic Adhesives', 'Cyanoacrylate Adhesives'],
      },
      {
        name: 'Industrial Adhesives',
        items: ['Metal Adhesive', 'Plastic Adhesive', 'Rubber Adhesive', 'Glass Adhesive', 'Ceramic Adhesive'],
      },
      { name: 'Sealants', items: ['Silicone Sealant', 'RTV Sealant', 'Pipe Sealant', 'Gasket Maker', 'Flange Sealant'] },
    ],
  },
  {
    name: 'Hardware Tools',
    slug: 'hardware-tools',
    icon: 'wrench',
    description: 'Hand, cutting, power and workshop tools from trusted brands — built for daily industrial use.',
    subcategories: [
      { name: 'Hand Tools', items: ['Spanners', 'Wrenches', 'Screwdrivers', 'Pliers', 'Hammers', 'Allen Keys', 'Pipe Wrenches'] },
      { name: 'Cutting Tools', items: ['Hacksaws', 'Cutting Blades', 'Drill Bits', 'Taps', 'Dies', 'Reamers'] },
      { name: 'Power Tools', items: ['Drills', 'Angle Grinders', 'Impact Wrenches', 'Electric Sanders', 'Cutting Machines'] },
      { name: 'Workshop Tools', items: ['Vices', 'Clamps', 'Tool Kits', 'Measuring Tools', 'Torque Wrenches', 'Pullers'] },
    ],
  },
  {
    name: 'Electronic Components',
    slug: 'electronic-components',
    icon: 'cpu',
    menuLabel: 'Electronics',
    description: 'Passive and semiconductor components, switching devices, wiring accessories and industrial electronics.',
    subcategories: [
      { name: 'Passive Components', items: ['Resistors', 'Capacitors', 'Inductors', 'Transformers', 'Potentiometers'] },
      { name: 'Semiconductor Components', items: ['Diodes', 'LEDs', 'Transistors', 'MOSFETs', 'ICs', 'Voltage Regulators'] },
      { name: 'Switching Components', items: ['Relays', 'Contactors', 'Switches', 'Push Buttons', 'Circuit Breakers'] },
      {
        name: 'Connectors & Wiring',
        items: ['Terminal Blocks', 'Cable Lugs', 'Connectors', 'Plugs', 'Sockets', 'Wires', 'Cables'],
      },
      {
        name: 'Industrial Electronics',
        items: ['PLC Components', 'Sensors', 'Power Supplies', 'Control Modules', 'Industrial Controllers', 'Timers'],
      },
    ],
  },
  {
    name: 'Rubber Items',
    slug: 'rubber-items',
    icon: 'circle',
    menuLabel: 'Rubber',
    description: 'Rubber sheets, seals, gaskets and molded components in neoprene, EPDM, silicone and nitrile.',
    subcategories: [
      {
        name: 'Rubber Sheets',
        items: ['Neoprene Sheets', 'EPDM Sheets', 'Silicone Sheets', 'Nitrile Sheets', 'Natural Rubber Sheets'],
      },
      { name: 'Sealing Products', items: ['Rubber Gaskets', 'O-Rings', 'Rubber Seals', 'Oil Seals', 'Rubber Washers'] },
      {
        name: 'Rubber Components',
        items: ['Rubber Bushes', 'Rubber Mounts', 'Rubber Pads', 'Rubber Profiles', 'Rubber Tubes', 'Rubber Hoses'],
      },
      {
        name: 'Industrial Rubber',
        items: ['Heat Resistant Rubber', 'Oil Resistant Rubber', 'Chemical Resistant Rubber', 'Food Grade Rubber', 'High Pressure Rubber'],
      },
    ],
  },
  {
    name: 'Industrial Oils',
    slug: 'industrial-oils',
    icon: 'fuel',
    description: 'Lubricating and specialty oils, greases and maintenance fluids for every plant application.',
    subcategories: [
      {
        name: 'Lubricating Oils',
        items: ['Hydraulic Oil', 'Gear Oil', 'Compressor Oil', 'Turbine Oil', 'Circulating Oil', 'Machine Oil'],
      },
      { name: 'Specialty Oils', items: ['Cutting Oil', 'Slideway Oil', 'Spindle Oil', 'Heat Transfer Oil', 'Transformer Oil'] },
      {
        name: 'Industrial Lubricants',
        items: ['Bearing Grease', 'High Temperature Grease', 'EP Grease', 'Lithium Grease', 'Food Grade Lubricants'],
      },
      { name: 'Maintenance Oils', items: ['Rust Preventive Oil', 'Penetrating Oil', 'Chain Oil', 'Mould Release Oil'] },
    ],
  },
];

/* ── Rich data for selected items (keyed by category/sub/name) ─────── */

const ENHANCEMENTS: Record<string, Enhancement> = {
  'chemicals/water-treatment-chemicals/Sodium Hypochlorite': {
    featured: true,
    shortDescription: 'High-strength disinfectant and oxidizer for municipal and industrial water systems.',
    description:
      'Stabilized sodium hypochlorite solution for disinfection, chlorination and odor control in water treatment plants, cooling towers and process water systems. Supplied in sealed carboys or drums with batch certificates and current MSDS.',
    specs: {
      'Available Chlorine': '10–12%',
      Appearance: 'Pale yellow to light green liquid',
      Packaging: '30 / 50 kg carboys, 200 kg drums',
      'Shelf Life': '60–90 days (cool, dark storage)',
      Documentation: 'Batch certificate + MSDS with every consignment',
    },
    applications: ['Municipal water disinfection', 'Cooling tower biocontrol', 'Process water chlorination', 'Sanitation of tanks and pipelines'],
    tags: ['water-treatment', 'disinfectant'],
  },
  'paints/industrial-paints/Epoxy Paint': {
    featured: true,
    shortDescription: 'Two-pack epoxy coating for machinery, floors and steelwork in demanding plant environments.',
    description:
      'High-build two-component epoxy paint delivering a tough, chemical-resistant finish on machinery, structural steel and concrete floors. Available in RAL shades with matching primers; spray or brush application with full technical data support.',
    specs: {
      Type: 'Two-pack polyamide-cured epoxy',
      'Coverage (theoretical)': '8–10 m²/L at 50 µm DFT',
      'Dry to Touch': '4–6 hours at 25°C',
      'Full Cure': '7 days',
      Packaging: '4 L / 20 L kits (base + hardener)',
      Shades: 'RAL shades on order',
    },
    variants: ['Gloss finish', 'Semi-gloss finish', 'Floor-grade (self-levelling)'],
    applications: ['Machine bodies and frames', 'Structural steelwork', 'Industrial flooring', 'Chemical plant equipment'],
    tags: ['coatings', 'two-pack'],
  },
  'stainless-steel/stainless-steel-sheets/SS 304 Sheets': {
    featured: true,
    shortDescription: 'General-purpose austenitic stainless steel sheet in all standard sizes and finishes.',
    description:
      'ASTM A240 Type 304 stainless steel sheets for fabrication, food processing equipment, cladding and general corrosion-resistant service. Cut-to-size available on order; mill test certificates supplied with every batch.',
    specs: {
      Grade: 'SS 304 (ASTM A240 / EN 1.4301)',
      'Thickness Range': '0.4 – 6.0 mm',
      'Standard Sheet Size': '4 ft × 8 ft (1219 × 2438 mm)',
      Finishes: '2B, BA, No. 4, Mirror, Hairline',
      Certification: 'Mill test certificate (EN 10204 3.1) on request',
    },
    variants: ['0.4–1.2 mm (foil/ thin)', '1.5–3.0 mm', '4.0–6.0 mm', 'Cut-to-size'],
    applications: ['Food & pharma equipment', 'Architectural cladding', 'Tanks and vessels', 'General fabrication'],
    tags: ['stainless', 'sheet'],
  },
  'ptfe/ptfe-products/PTFE Rods': {
    featured: true,
    shortDescription: 'Virgin PTFE rods from 6 mm to 150 mm diameter for machining into seals and components.',
    description:
      'Virgin polytetrafluoroethylene rods with outstanding chemical inertness and a continuous service range of −200°C to +260°C. Supplied in standard lengths or cut pieces; filled grades (glass, carbon, graphite) available on order.',
    specs: {
      Material: 'Virgin PTFE (99.9%)',
      'Diameter Range': '6 – 150 mm',
      'Standard Length': '100 / 200 / 1000 mm',
      'Temperature Range': '−200°C to +260°C',
      'Filled Grades': 'Glass, carbon, graphite filled (on order)',
    },
    variants: ['Virgin PTFE', 'Glass-filled 25%', 'Carbon-filled 25%', 'Graphite-filled'],
    applications: ['Machined seals and gaskets', 'Bearings and bushes', 'Electrical insulation', 'Chemical plant linings'],
    tags: ['ptfe', 'machining-stock'],
  },
  'industrial-oils/lubricating-oils/Hydraulic Oil': {
    featured: true,
    shortDescription: 'Anti-wear hydraulic oils in ISO VG 32/46/68 for industrial and mobile systems.',
    description:
      'Premium anti-wear (HM-type) hydraulic oils formulated with zinc-free additive technology for reliable pump protection, filterability and demulsibility. Available in pails and drums with consistent batch-to-batch viscosity.',
    specs: {
      'ISO VG Grades': '32 / 46 / 68',
      'Viscosity Index': '≥ 95',
      'Flash Point': '≥ 200°C',
      'Pour Point': '≤ −18°C',
      Packaging: '20 L pail, 208 L drum',
    },
    variants: ['ISO VG 32', 'ISO VG 46', 'ISO VG 68'],
    applications: ['Industrial hydraulic systems', 'Injection molding machines', 'Presses and machine tools', 'Mobile hydraulic equipment'],
    tags: ['lubricants', 'anti-wear'],
  },
  'fasteners/bolts/Hex Bolts': {
    featured: true,
    shortDescription: 'Full-diameter hex head bolts in mild steel, high-tensile and stainless grades.',
    description:
      'Hexagon head bolts in DIN 931 / ISO 4014 (partial thread) and DIN 933 / ISO 4017 (full thread), from M6 to M56. Available in grades 4.8, 8.8 and 10.9 plus SS-304/316; hot-dip galvanized finish for outdoor service.',
    specs: {
      Standards: 'DIN 931 / DIN 933 (ISO equivalent)',
      'Size Range': 'M6 – M56',
      'Property Classes': '4.8, 8.8, 10.9',
      'Stainless Grades': 'A2 (SS-304), A4 (SS-316)',
      Finishes: 'Self-color, zinc-plated, hot-dip galvanized',
    },
    variants: ['Grade 4.8 (mild steel)', 'Grade 8.8 (high tensile)', 'Grade 10.9 (alloy steel)', 'SS-304', 'SS-316'],
    applications: ['Structural connections', 'Machine assembly', 'Solar and steel structures', 'General maintenance'],
    tags: ['fasteners', 'bolts'],
  },
  'steel-balls/bearing-balls/Chrome Steel Balls': {
    featured: true,
    shortDescription: 'GCR15 / AISI 52100 chrome steel balls in grades G100–G1000, 1 mm to 50 mm.',
    description:
      'Through-hardened chrome steel bearing balls (AISI 52100 / GCR15) with HRC 60–67 hardness for bearings, valves, linear motion and precision applications. Supplied in grades G100–G1000 with hardness and size certificates.',
    specs: {
      Material: 'AISI 52100 / GCR15',
      Hardness: 'HRC 60–67',
      'Size Range': '1 mm – 50 mm',
      Grades: 'G100 – G1000',
      Packaging: 'Sealed poly bags / drums by weight',
    },
    variants: ['1–6 mm', '6–12 mm', '12–25 mm', '25–50 mm', 'Custom sizes'],
    applications: ['Ball bearings', 'Valve balls', 'Linear motion guides', 'Measurement instruments'],
    tags: ['bearings', 'precision'],
  },
  'adhesives/threadlockers/Threadlocker Medium Strength': {
    featured: true,
    shortDescription: 'General-purpose medium-strength threadlocker for M6–M20 fasteners; removable with hand tools.',
    description:
      'Anaerobic medium-strength threadlocker that locks and seals threaded fasteners against vibration loosening while remaining removable with standard hand tools. Ideal for machine assembly and maintenance; cures on active metal surfaces without primers.',
    specs: {
      'Strength': 'Medium (removable with hand tools)',
      'Thread Range': 'M6 – M20',
      'Cure Speed': 'Fixture 10–20 min, full 24 h',
      'Temperature Range': '−55°C to +150°C',
      Packaging: '10 / 50 / 250 ml bottles',
    },
    applications: ['Machine assembly bolts', 'Pump and motor fasteners', 'Vibration-exposed joints', 'General maintenance'],
    tags: ['threadlocker', 'maintenance'],
  },
};

/* ── Build the products tree ───────────────────────────────────────── */

interface BuiltItem {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  specs: Record<string, string>;
  variants: string[];
  applications: string[];
  datasheet: string;
  featured: boolean;
  tags: string[];
}

function buildItems(sub: RawSubcategory, catSlug: string, subSlug: string): BuiltItem[] {
  return sub.items.map((raw) => {
    const name = typeof raw === 'string' ? raw : raw.name;
    const slug = (typeof raw === 'string' ? undefined : raw.slug) ?? slugify(name);
    const enhancement = ENHANCEMENTS[`${catSlug}/${subSlug}/${name}`] ?? {};
    return {
      slug,
      name,
      shortDescription: enhancement.shortDescription ?? '',
      description: enhancement.description ?? '',
      images: [] as string[],
      specs: enhancement.specs ?? {},
      variants: enhancement.variants ?? [],
      applications: enhancement.applications ?? [],
      datasheet: enhancement.datasheet ?? '',
      featured: enhancement.featured ?? false,
      tags: enhancement.tags ?? [],
    };
  });
}

const products = {
  categories: CATALOG.map((cat, ci) => ({
    slug: cat.slug,
    name: cat.name,
    icon: cat.icon,
    image: cat.image ?? '',
    description: cat.description,
    menuLabel: cat.menuLabel ?? '',
    order: ci + 1,
    subcategories: cat.subcategories.map((sub) => {
      const subSlug = sub.slug ?? slugify(sub.name);
      return {
        slug: subSlug,
        name: sub.name,
        description: sub.description ?? '',
        image: sub.image ?? '',
        menuLabel: sub.menuLabel ?? '',
        items: buildItems(sub, cat.slug, subSlug),
      };
    }),
  })),
};

/* ── Write file ────────────────────────────────────────────────────── */

const outPath = fileURLToPath(new URL('../src/data/products.json', import.meta.url));
writeFileSync(outPath, JSON.stringify(products, null, 2) + '\n', 'utf-8');

const nCats = products.categories.length;
const nSubs = products.categories.reduce((n, c) => n + c.subcategories.length, 0);
const nItems = products.categories.reduce(
  (n, c) => n + c.subcategories.reduce((m, s) => m + s.items.length, 0),
  0
);
const nFeatured = products.categories.reduce(
  (n, c) => n + c.subcategories.reduce((m, s) => m + s.items.filter((i) => i.featured).length, 0),
  0
);
console.log(`✓ Wrote ${outPath}`);
console.log(`  ${nCats} categories · ${nSubs} subcategories · ${nItems} items (${nFeatured} featured)`);
