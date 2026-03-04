import { useState, useRef, useCallback, useEffect } from "react";

const GRID_SIZE = 20;

const C = {
  bg: "#0f1117", surface: "#1a1d27", panel: "#22263a", border: "#2e3350",
  accent: "#f59e0b", accent2: "#3b82f6", accent3: "#10b981", red: "#ef4444",
  text: "#e2e8f0", muted: "#64748b",
};

const FLOOR_PLANS = {
  studio: {
    name: "Studio Apartment", sqft: 500,
    rooms: [
      { id: 1, name: "Living/Bedroom", x: 1, y: 1, w: 20, h: 20, color: "#3b82f620", type: "living" },
      { id: 2, name: "Kitchen", x: 21, y: 1, w: 10, h: 10, color: "#f59e0b20", type: "kitchen" },
      { id: 3, name: "Bathroom", x: 21, y: 11, w: 10, h: 10, color: "#10b98120", type: "bath" },
    ],
    doors: [{ id: 1, x: 10, y: 21, dir: "h" }, { id: 2, x: 21, y: 5, dir: "v" }, { id: 3, x: 21, y: 15, dir: "v" }],
    windows: [{ id: 1, x: 5, y: 1, dir: "h" }, { id: 2, x: 15, y: 1, dir: "h" }, { id: 3, x: 31, y: 1, dir: "h" }],
  },
  cottage: {
    name: "2BR Cottage", sqft: 900,
    rooms: [
      { id: 1, name: "Living Room", x: 1, y: 1, w: 20, h: 15, color: "#3b82f620", type: "living" },
      { id: 2, name: "Kitchen", x: 21, y: 1, w: 12, h: 10, color: "#f59e0b20", type: "kitchen" },
      { id: 3, name: "Dining", x: 21, y: 11, w: 12, h: 5, color: "#a78bfa20", type: "dining" },
      { id: 4, name: "Bedroom 1", x: 1, y: 16, w: 15, h: 12, color: "#f4724720", type: "bedroom" },
      { id: 5, name: "Bedroom 2", x: 16, y: 16, w: 17, h: 12, color: "#f4724720", type: "bedroom" },
      { id: 6, name: "Bathroom", x: 1, y: 28, w: 10, h: 8, color: "#10b98120", type: "bath" },
    ],
    doors: [{ id: 1, x: 15, y: 16, dir: "v" }, { id: 2, x: 16, y: 16, dir: "h" }, { id: 3, x: 21, y: 8, dir: "v" }, { id: 4, x: 5, y: 28, dir: "h" }],
    windows: [{ id: 1, x: 8, y: 1, dir: "h" }, { id: 2, x: 25, y: 1, dir: "h" }, { id: 3, x: 1, y: 22, dir: "v" }, { id: 4, x: 27, y: 16, dir: "v" }],
  },
  ranch: {
    name: "3BR Ranch", sqft: 1500,
    rooms: [
      { id: 1, name: "Living Room", x: 1, y: 1, w: 22, h: 18, color: "#3b82f620", type: "living" },
      { id: 2, name: "Kitchen", x: 23, y: 1, w: 16, h: 12, color: "#f59e0b20", type: "kitchen" },
      { id: 3, name: "Dining Room", x: 23, y: 13, w: 16, h: 6, color: "#a78bfa20", type: "dining" },
      { id: 4, name: "Master Bedroom", x: 1, y: 19, w: 20, h: 14, color: "#f4724720", type: "bedroom" },
      { id: 5, name: "Bedroom 2", x: 21, y: 19, w: 14, h: 10, color: "#f4724720", type: "bedroom" },
      { id: 6, name: "Bedroom 3", x: 21, y: 29, w: 14, h: 8, color: "#f4724720", type: "bedroom" },
      { id: 7, name: "Master Bath", x: 1, y: 33, w: 10, h: 8, color: "#10b98120", type: "bath" },
      { id: 8, name: "Bathroom 2", x: 11, y: 33, w: 10, h: 8, color: "#10b98120", type: "bath" },
      { id: 9, name: "Garage", x: 35, y: 1, w: 22, h: 22, color: "#64748b20", type: "garage" },
    ],
    doors: [{ id: 1, x: 20, y: 19, dir: "v" }, { id: 2, x: 21, y: 19, dir: "h" }, { id: 3, x: 30, y: 19, dir: "v" }, { id: 4, x: 5, y: 33, dir: "h" }, { id: 5, x: 15, y: 33, dir: "h" }, { id: 6, x: 35, y: 12, dir: "v" }],
    windows: [{ id: 1, x: 8, y: 1, dir: "h" }, { id: 2, x: 29, y: 1, dir: "h" }, { id: 3, x: 1, y: 25, dir: "v" }, { id: 4, x: 28, y: 19, dir: "v" }, { id: 5, x: 42, y: 1, dir: "h" }],
  },
  colonial: {
    name: "4BR Colonial", sqft: 2400,
    rooms: [
      { id: 1, name: "Foyer", x: 18, y: 1, w: 10, h: 8, color: "#fbbf2420", type: "foyer" },
      { id: 2, name: "Living Room", x: 1, y: 1, w: 17, h: 18, color: "#3b82f620", type: "living" },
      { id: 3, name: "Dining Room", x: 28, y: 1, w: 16, h: 18, color: "#a78bfa20", type: "dining" },
      { id: 4, name: "Kitchen", x: 18, y: 9, w: 10, h: 10, color: "#f59e0b20", type: "kitchen" },
      { id: 5, name: "Family Room", x: 1, y: 19, w: 25, h: 15, color: "#3b82f625", type: "living" },
      { id: 6, name: "Laundry", x: 26, y: 19, w: 18, h: 8, color: "#64748b20", type: "utility" },
      { id: 7, name: "Master Bedroom", x: 1, y: 34, w: 22, h: 14, color: "#f4724720", type: "bedroom" },
      { id: 8, name: "Master Bath", x: 23, y: 34, w: 12, h: 14, color: "#10b98120", type: "bath" },
      { id: 9, name: "Bedroom 2", x: 1, y: 48, w: 16, h: 12, color: "#f4724720", type: "bedroom" },
      { id: 10, name: "Bedroom 3", x: 17, y: 48, w: 16, h: 12, color: "#f4724720", type: "bedroom" },
      { id: 11, name: "Bedroom 4", x: 35, y: 34, w: 15, h: 14, color: "#f4724720", type: "bedroom" },
      { id: 12, name: "Bathroom 2", x: 35, y: 48, w: 15, h: 12, color: "#10b98120", type: "bath" },
      { id: 13, name: "Garage", x: 26, y: 27, w: 24, h: 20, color: "#64748b20", type: "garage" },
    ],
    doors: [{ id: 1, x: 18, y: 8, dir: "h" }, { id: 2, x: 22, y: 19, dir: "h" }, { id: 3, x: 22, y: 34, dir: "v" }, { id: 4, x: 8, y: 48, dir: "h" }, { id: 5, x: 24, y: 48, dir: "h" }, { id: 6, x: 38, y: 34, dir: "h" }],
    windows: [{ id: 1, x: 7, y: 1, dir: "h" }, { id: 2, x: 33, y: 1, dir: "h" }, { id: 3, x: 1, y: 10, dir: "v" }, { id: 4, x: 1, y: 25, dir: "v" }, { id: 5, x: 1, y: 40, dir: "v" }, { id: 6, x: 40, y: 34, dir: "v" }],
  },
};

const COST_MULTIPLIERS = {
  "National Average": 1.0, "Atlanta, GA": 1.1, "Austin, TX": 1.2, "Boston, MA": 1.6,
  "Chicago, IL": 1.3, "Denver, CO": 1.25, "Houston, TX": 1.1, "Los Angeles, CA": 1.6,
  "Miami, FL": 1.25, "New York, NY": 1.8, "Phoenix, AZ": 1.1, "San Francisco, CA": 1.9, "Seattle, WA": 1.5,
};

function calcBOM(rooms) {
  const totalSqft = rooms.reduce((s, r) => s + r.w * r.h, 0);
  const perimeter = Math.sqrt(totalSqft) * 4;
  const bathRooms = rooms.filter(r => r.type === "bath");
  const kitchenRooms = rooms.filter(r => r.type === "kitchen");
  return [
    { category: "Foundation", item: "Concrete", qty: Math.ceil(totalSqft * 0.1), unit: "CY", unitCost: 125 },
    { category: "Foundation", item: "Rebar", qty: Math.ceil(perimeter * 2), unit: "LF", unitCost: 1.2 },
    { category: "Framing", item: "Lumber (2x6)", qty: Math.ceil(perimeter * 8 * 0.75), unit: "LF", unitCost: 0.85 },
    { category: "Framing", item: "OSB Sheathing", qty: Math.ceil(perimeter * 8 / 32), unit: "Sheets", unitCost: 42 },
    { category: "Framing", item: "Roof Trusses", qty: Math.ceil(totalSqft / 24), unit: "EA", unitCost: 180 },
    { category: "Roofing", item: "Asphalt Shingles", qty: Math.ceil((totalSqft * 1.15) / 100), unit: "Squares", unitCost: 110 },
    { category: "Roofing", item: "Roofing Felt", qty: Math.ceil((totalSqft * 1.15) / 100), unit: "Rolls", unitCost: 35 },
    { category: "Roofing", item: "Ridge Vent", qty: Math.ceil(Math.sqrt(totalSqft)), unit: "LF", unitCost: 4.5 },
    { category: "Exterior", item: "Vinyl Siding", qty: Math.ceil(perimeter * 8 / 100), unit: "Squares", unitCost: 95 },
    { category: "Exterior", item: "Windows", qty: Math.max(8, Math.ceil(totalSqft / 100)), unit: "EA", unitCost: 650 },
    { category: "Exterior", item: "Exterior Doors", qty: Math.max(2, Math.ceil(rooms.length / 5)), unit: "EA", unitCost: 850 },
    { category: "Insulation", item: "Batt Insulation", qty: Math.ceil(totalSqft * 1.1), unit: "SF", unitCost: 1.2 },
    { category: "Insulation", item: "Attic Blown-in", qty: Math.ceil(totalSqft), unit: "SF", unitCost: 1.8 },
    { category: "Drywall", item: "Drywall Sheets", qty: Math.ceil((totalSqft * 2.1) / 32), unit: "Sheets", unitCost: 18 },
    { category: "Drywall", item: "Joint Compound", qty: Math.ceil(totalSqft / 400), unit: "Buckets", unitCost: 22 },
    { category: "Flooring", item: "LVP Flooring", qty: Math.ceil(totalSqft * 1.1), unit: "SF", unitCost: 4.5 },
    { category: "Flooring", item: "Tile (Baths)", qty: Math.ceil(bathRooms.reduce((s, r) => s + r.w * r.h, 0) * 1.15), unit: "SF", unitCost: 6 },
    { category: "Plumbing", item: "Rough-in Plumbing", qty: bathRooms.length + kitchenRooms.length, unit: "Fixtures", unitCost: 1800 },
    { category: "Plumbing", item: "Water Heater", qty: Math.max(1, Math.ceil(totalSqft / 2000)), unit: "EA", unitCost: 1200 },
    { category: "Electrical", item: "Electrical Panel", qty: 1, unit: "EA", unitCost: 2500 },
    { category: "Electrical", item: "Wiring (romex)", qty: Math.ceil(totalSqft * 3), unit: "LF", unitCost: 0.45 },
    { category: "Electrical", item: "Outlets & Switches", qty: Math.ceil(totalSqft / 25), unit: "EA", unitCost: 35 },
    { category: "HVAC", item: "HVAC System", qty: Math.ceil(totalSqft / 600), unit: "Tons", unitCost: 3800 },
    { category: "HVAC", item: "Ductwork", qty: Math.ceil(totalSqft * 1.5), unit: "LF", unitCost: 2.5 },
    { category: "Interior", item: "Interior Doors", qty: Math.max(4, rooms.length - 1), unit: "EA", unitCost: 280 },
    { category: "Interior", item: "Trim & Molding", qty: Math.ceil(perimeter * 3), unit: "LF", unitCost: 2.2 },
    { category: "Interior", item: "Interior Paint", qty: Math.ceil(totalSqft * 2 / 400), unit: "Gallons", unitCost: 45 },
    { category: "Cabinets", item: "Kitchen Cabinets", qty: kitchenRooms.length > 0 ? Math.ceil(kitchenRooms[0].w * 2) : 0, unit: "LF", unitCost: 220 },
    { category: "Cabinets", item: "Countertops", qty: kitchenRooms.length > 0 ? Math.ceil(kitchenRooms[0].w * 2) : 0, unit: "LF", unitCost: 85 },
    { category: "Labor", item: "General Contractor", qty: 1, unit: "Project", unitCost: totalSqft * 45 },
    { category: "Labor", item: "Site Cleanup", qty: 1, unit: "Project", unitCost: totalSqft * 1.5 },
  ].filter(i => i.qty > 0);
}

const BUILDING_CODES = {
  "New York, NY": {
    code: "NYC Building Code 2022",
    permits: [
      { name: "Building Permit", fee: "$0.035/SF + $3,000 base", required: true },
      { name: "Zoning Compliance", fee: "$1,500", required: true },
      { name: "Electrical Permit", fee: "$500–$2,000", required: true },
      { name: "Plumbing Permit", fee: "$400–$1,500", required: true },
      { name: "Environmental Review", fee: "$800", required: true },
    ],
    notes: ["Min ceiling height: 8ft", "Fire sprinklers required for 4+ units", "Energy Code: NY Stretch Code", "Min lot setbacks: 25ft front, 5ft sides"],
  },
  "Austin, TX": {
    code: "Austin Land Development Code + IBC 2021",
    permits: [
      { name: "Building Permit", fee: "$0.02/SF + $1,000 base", required: true },
      { name: "Site Plan Approval", fee: "$750", required: true },
      { name: "Electrical Permit", fee: "$250–$800", required: true },
      { name: "Plumbing Permit", fee: "$200–$600", required: true },
    ],
    notes: ["Min ceiling height: 7ft-6in", "Impervious cover limits apply", "Energy Code: Texas ECAD", "Minimum 1,400 SF for single-family"],
  },
  "National Average": {
    code: "International Building Code (IBC) 2021",
    permits: [
      { name: "Building Permit", fee: "$0.015–0.04/SF", required: true },
      { name: "Electrical Permit", fee: "$150–$600", required: true },
      { name: "Plumbing Permit", fee: "$150–$500", required: true },
      { name: "HVAC Permit", fee: "$100–$400", required: true },
      { name: "Certificate of Occupancy", fee: "$100–$300", required: true },
    ],
    notes: ["Min ceiling height: 7ft (IBC)", "Smoke detectors required in all bedrooms", "GFCI outlets near water sources", "Min 1 accessible entrance required", "Energy compliance: IECC 2021"],
  },
};

// ─── Responsive Canvas ────────────────────────────────────────────────────────
function FloorPlanCanvas({ rooms, doors, windows, onRoomsChange, selectedRoom, onSelectRoom, zoom }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 500 });
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const CELL = GRID_SIZE * zoom;

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setCanvasSize({ w: Math.max(200, Math.floor(width)), h: Math.max(200, Math.floor(height)) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = "#1e2235"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    rooms.forEach(r => {
      const rx = r.x * CELL, ry = r.y * CELL, rw = r.w * CELL, rh = r.h * CELL;
      ctx.fillStyle = selectedRoom === r.id ? "rgba(245,158,11,0.15)" : r.color;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = selectedRoom === r.id ? C.accent : "#3b82f6";
      ctx.lineWidth = selectedRoom === r.id ? 2.5 : 1.5;
      ctx.strokeRect(rx, ry, rw, rh);

      const ls = Math.max(8, Math.min(13, CELL * 0.5));
      const ds = Math.max(7, Math.min(10, CELL * 0.38));
      ctx.fillStyle = selectedRoom === r.id ? C.accent : "#94a3b8";
      ctx.font = `bold ${ls}px 'DM Sans', sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(r.name, rx + rw / 2, ry + rh / 2 - CELL * 0.28);
      ctx.font = `${ds}px 'DM Sans', sans-serif`;
      ctx.fillStyle = C.muted;
      ctx.fillText(`${r.w}' × ${r.h}'`, rx + rw / 2, ry + rh / 2 + CELL * 0.28);
      ctx.fillText(`${r.w * r.h} SF`, rx + rw / 2, ry + rh / 2 + CELL * 0.62);

      if (selectedRoom === r.id) {
        ctx.fillStyle = C.accent;
        ctx.fillRect(rx + rw - 10, ry + rh - 10, 10, 10);
      }
    });

    doors.forEach(d => {
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3;
      ctx.beginPath();
      if (d.dir === "h") { ctx.moveTo(d.x * CELL, d.y * CELL); ctx.lineTo((d.x + 1) * CELL, d.y * CELL); }
      else { ctx.moveTo(d.x * CELL, d.y * CELL); ctx.lineTo(d.x * CELL, (d.y + 1) * CELL); }
      ctx.stroke();
    });

    windows.forEach(w => {
      ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 4;
      ctx.beginPath();
      if (w.dir === "h") { ctx.moveTo(w.x * CELL, w.y * CELL); ctx.lineTo((w.x + 2) * CELL, w.y * CELL); }
      else { ctx.moveTo(w.x * CELL, w.y * CELL); ctx.lineTo(w.x * CELL, (w.y + 2) * CELL); }
      ctx.stroke();
    });
  }, [rooms, doors, windows, selectedRoom, CELL, canvasSize]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const getCell = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    return { cx: Math.floor(px / CELL), cy: Math.floor(py / CELL), px, py };
  };

  const handleMouseDown = (e) => {
    const { cx, cy, px, py } = getCell(e);
    for (const r of rooms) {
      if (selectedRoom === r.id) {
        const rx = r.x * CELL, ry = r.y * CELL, rw = r.w * CELL, rh = r.h * CELL;
        if (Math.abs(px - (rx + rw)) < 14 && Math.abs(py - (ry + rh)) < 14) {
          setResizing({ id: r.id, startW: r.w, startH: r.h, startPx: px, startPy: py }); return;
        }
      }
    }
    const hit = rooms.find(r => cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h);
    if (hit) { onSelectRoom(hit.id); setDragging({ id: hit.id, offX: cx - hit.x, offY: cy - hit.y }); }
    else onSelectRoom(null);
  };

  const handleMouseMove = (e) => {
    const { cx, cy, px, py } = getCell(e);
    if (dragging) onRoomsChange(rooms.map(r => r.id === dragging.id ? { ...r, x: Math.max(0, cx - dragging.offX), y: Math.max(0, cy - dragging.offY) } : r));
    if (resizing) {
      const dx = Math.round((px - resizing.startPx) / CELL);
      const dy = Math.round((py - resizing.startPy) / CELL);
      onRoomsChange(rooms.map(r => r.id === resizing.id ? { ...r, w: Math.max(4, resizing.startW + dx), h: Math.max(4, resizing.startH + dy) } : r));
    }
  };

  const handleMouseUp = () => { setDragging(null); setResizing(null); };

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.w} height={canvasSize.h}
        style={{ display: "block", cursor: dragging || resizing ? "grabbing" : "crosshair" }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function HouseBuilderApp() {
  const [tab, setTab] = useState("design");
  const [plan, setPlan] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [zoom, setZoom] = useState(0.8);
  const [location, setLocation] = useState("National Average");
  const [saves, setSaves] = useState(() => { try { return JSON.parse(localStorage.getItem("houseBuilds") || "[]"); } catch { return []; } });
  const [saveName, setSaveName] = useState("");
  const [bomFilter, setBomFilter] = useState("All");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "New Room", w: 12, h: 10, type: "living" });
  const [buildingCodes, setBuildingCodes] = useState(null);
  const [codesLoading, setCodesLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const loadPlan = (key) => {
    const p = FLOOR_PLANS[key];
    setPlan(key); setRooms(p.rooms.map(r => ({ ...r }))); setDoors(p.doors.map(d => ({ ...d }))); setWindows(p.windows.map(w => ({ ...w })));
    setSelectedRoom(null); setSaveName(p.name); setTab("design");
  };

  const totalSqft = rooms.reduce((s, r) => s + r.w * r.h, 0);
  const mult = COST_MULTIPLIERS[location] || 1.0;
  const bom = rooms.length ? calcBOM(rooms) : [];
  const categories = ["All", ...new Set(bom.map(i => i.category))];
  const filteredBOM = bomFilter === "All" ? bom : bom.filter(i => i.category === bomFilter);
  const totalCost = bom.reduce((s, i) => s + i.qty * i.unitCost * mult, 0);

  const saveProject = () => {
    if (!saveName.trim()) return;
    const build = { name: saveName, date: new Date().toLocaleDateString(), plan, rooms, doors, windows, location };
    const next = [build, ...saves.filter(s => s.name !== saveName)].slice(0, 20);
    setSaves(next);
    try { localStorage.setItem("houseBuilds", JSON.stringify(next)); } catch {}
    setSaveMsg("✓ Saved!"); setTimeout(() => setSaveMsg(""), 2000);
  };

  const loadSave = (s) => {
    setPlan(s.plan); setRooms(s.rooms); setDoors(s.doors); setWindows(s.windows);
    setLocation(s.location || "National Average"); setSaveName(s.name);
    setSelectedRoom(null); setTab("design");
  };

  const addRoom = () => {
    const id = Math.max(0, ...rooms.map(r => r.id)) + 1;
    const colors = { living: "#3b82f620", kitchen: "#f59e0b20", bedroom: "#f4724720", bath: "#10b98120", dining: "#a78bfa20", garage: "#64748b20", utility: "#64748b20", foyer: "#fbbf2420" };
    setRooms([...rooms, { id, name: newRoom.name, x: 2, y: 2, w: newRoom.w, h: newRoom.h, color: colors[newRoom.type] || "#3b82f620", type: newRoom.type }]);
    setShowNewRoom(false); setNewRoom({ name: "New Room", w: 12, h: 10, type: "living" });
  };

  const deleteSelectedRoom = () => { setRooms(rooms.filter(r => r.id !== selectedRoom)); setSelectedRoom(null); };
  const updateRoom = (field, val) => setRooms(rooms.map(r => r.id === selectedRoom ? { ...r, [field]: field === "name" ? val : Number(val) } : r));
  const selRoom = rooms.find(r => r.id === selectedRoom);

  const lookupCodes = () => {
    setCodesLoading(true);
    setTimeout(() => { setBuildingCodes(BUILDING_CODES[location] || BUILDING_CODES["National Average"]); setCodesLoading(false); }, 600);
  };

  const lbl = { color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 };
  const secHd = { color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 12px 5px", borderBottom: `1px solid ${C.border}`, marginTop: 4 };

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      background: C.bg, color: C.text,
      fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13,
      overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        input, select, button { font-family: inherit; }
        .ri { background: ${C.panel}; border: 1px solid ${C.border}; color: ${C.text}; padding: 5px 9px; border-radius: 5px; font-size: 12px; width: 100%; outline: none; font-family: inherit; }
        .ri:focus { border-color: ${C.accent}; }
        .btn { padding: 5px 12px; border-radius: 5px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.13s; white-space: nowrap; }
        .bp { background: ${C.accent}; color: #000; } .bp:hover { background: #d97706; }
        .bg { background: ${C.panel}; color: ${C.text}; border: 1px solid ${C.border}; } .bg:hover { border-color: ${C.accent}; color: ${C.accent}; }
        .bd { background: ${C.red}18; color: ${C.red}; border: 1px solid ${C.red}40; } .bd:hover { background: ${C.red}; color: #fff; }
        .bs { background: ${C.accent3}; color: #000; }
        .tag { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .pc { border: 1px solid ${C.border}; border-radius: 6px; padding: 9px 11px; cursor: pointer; transition: all 0.15s; margin-bottom: 5px; }
        .pc:hover { border-color: ${C.accent}; background: ${C.accent}08; }
        .ri-sel { padding: 6px 10px; border-radius: 5px; cursor: pointer; border: 1px solid transparent; transition: all 0.12s; margin-bottom: 2px; }
        .ri-sel:hover { background: ${C.border}28; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; color: ${C.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 7px 10px; border-bottom: 1px solid ${C.border}; background: ${C.surface}; position: sticky; top: 0; z-index: 1; }
        td { padding: 6px 10px; border-bottom: 1px solid ${C.border}18; }
        tr:hover td { background: ${C.border}14; }
      `}</style>

      {/* ── Header (fixed height, no wrap) ── */}
      <div style={{ height: 46, flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: C.accent, whiteSpace: "nowrap", marginRight: 4 }}>🏠 BuildCraft</span>
        {[["design","🏗 Design"],["materials","📦 Materials"],["codes","📋 Permits"],["saves","💾 Saves"]].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t)} className="btn"
            style={{ background: tab === t ? C.accent : "transparent", color: tab === t ? "#000" : C.muted, border: "none", padding: "4px 10px", fontSize: 12 }}>
            {lbl}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: C.muted, fontSize: 11, whiteSpace: "nowrap" }}>📍</span>
          <select value={location} onChange={e => setLocation(e.target.value)} className="ri" style={{ width: 170, height: 28, fontSize: 11 }}>
            {Object.keys(COST_MULTIPLIERS).map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* ── Main Content (fills remaining height exactly) ── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>

        {/* ===== DESIGN TAB ===== */}
        {tab === "design" && <>
          {/* Sidebar — fixed width, internal scroll */}
          <div style={{ width: 210, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <div style={secHd}>Floor Plans</div>
              <div style={{ padding: "6px 10px" }}>
                {Object.entries(FLOOR_PLANS).map(([key, p]) => (
                  <div key={key} className="pc" style={{ background: plan === key ? `${C.accent}12` : C.panel, borderColor: plan === key ? C.accent : C.border }} onClick={() => loadPlan(key)}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                    <div style={{ color: C.muted, fontSize: 10 }}>{p.sqft.toLocaleString()} SF · {p.rooms.length} rooms</div>
                  </div>
                ))}
              </div>

              {rooms.length > 0 && <>
                <div style={{ ...secHd, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Rooms</span>
                  <button className="btn bg" onClick={() => setShowNewRoom(true)} style={{ padding: "1px 7px", fontSize: 10 }}>+ Add</button>
                </div>
                <div style={{ padding: "5px 10px" }}>
                  {rooms.map(r => (
                    <div key={r.id} className="ri-sel" onClick={() => setSelectedRoom(r.id === selectedRoom ? null : r.id)}
                      style={{ border: `1px solid ${r.id === selectedRoom ? C.accent : "transparent"}`, background: r.id === selectedRoom ? `${C.accent}10` : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 500, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color.replace("20", "cc"), flexShrink: 0, marginLeft: 4 }} />
                      </div>
                      <div style={{ color: C.muted, fontSize: 10 }}>{r.w}' × {r.h}' = {r.w * r.h} SF</div>
                    </div>
                  ))}
                </div>

                {selRoom && <>
                  <div style={secHd}>Edit Room</div>
                  <div style={{ padding: "6px 10px 4px" }}>
                    <div style={{ marginBottom: 6 }}>
                      <span style={lbl}>Name</span>
                      <input className="ri" value={selRoom.name} onChange={e => updateRoom("name", e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                      <div><span style={lbl}>Width ft</span><input className="ri" type="number" min={4} max={80} value={selRoom.w} onChange={e => updateRoom("w", e.target.value)} /></div>
                      <div><span style={lbl}>Depth ft</span><input className="ri" type="number" min={4} max={80} value={selRoom.h} onChange={e => updateRoom("h", e.target.value)} /></div>
                    </div>
                    <div style={{ background: `${C.accent}18`, borderRadius: 5, padding: "5px 9px", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: C.muted, fontSize: 11 }}>Area</span>
                      <span style={{ fontWeight: 700, color: C.accent, fontSize: 12 }}>{selRoom.w * selRoom.h} SF</span>
                    </div>
                    <button className="btn bd" style={{ width: "100%", fontSize: 11 }} onClick={deleteSelectedRoom}>🗑 Delete Room</button>
                  </div>
                </>}

                <div style={secHd}>Summary</div>
                <div style={{ padding: "5px 10px" }}>
                  {[["Total Area",`${totalSqft.toLocaleString()} SF`],["Rooms",rooms.length],["Est. Cost",`$${Math.round(totalCost).toLocaleString()}`],["Cost/SF",`$${Math.round(totalCost/(totalSqft||1))}`]].map(([k,v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span style={{ color: C.muted, fontSize: 11 }}>{k}</span>
                      <span style={{ fontWeight: 600, fontSize: 12, color: k === "Est. Cost" ? C.accent3 : C.text }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={secHd}>Save Build</div>
                <div style={{ padding: "6px 10px 12px" }}>
                  <input className="ri" placeholder="Project name..." value={saveName} onChange={e => setSaveName(e.target.value)} style={{ marginBottom: 5 }} />
                  <button className="btn bp" style={{ width: "100%", fontSize: 12 }} onClick={saveProject}>{saveMsg || "💾 Save Project"}</button>
                </div>
              </>}
            </div>
          </div>

          {/* Canvas panel */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {rooms.length > 0 && (
              <div style={{ height: 36, flexShrink: 0, padding: "0 12px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.muted, fontSize: 11 }}>Zoom:</span>
                <button className="btn bg" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}>−</button>
                <span style={{ fontSize: 11, minWidth: 34, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                <button className="btn bg" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(1)))}>+</button>
                <button className="btn bg" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setZoom(0.8)}>Reset</button>
                <span style={{ marginLeft: "auto", color: C.muted, fontSize: 11 }}>🟡 Door · 🔵 Window · Click=select · Drag=move · Corner▪=resize</span>
              </div>
            )}
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              {rooms.length === 0 ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.muted, gap: 10 }}>
                  <div style={{ fontSize: 52 }}>🏠</div>
                  <div style={{ fontSize: 17, fontFamily: "'Playfair Display', serif", color: C.text }}>Choose a Floor Plan</div>
                  <div style={{ fontSize: 12 }}>Select a template from the sidebar to begin</div>
                </div>
              ) : (
                <FloorPlanCanvas rooms={rooms} doors={doors} windows={windows} onRoomsChange={setRooms} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} zoom={zoom} />
              )}
            </div>
          </div>
        </>}

        {/* ===== MATERIALS TAB ===== */}
        {tab === "materials" && (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {rooms.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: C.muted, gap: 12 }}>
                <div style={{ fontSize: 44 }}>📦</div><div>Load a floor plan first to see the bill of materials</div>
              </div>
            ) : <>
              {/* Stats strip */}
              <div style={{ display: "flex", flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {[
                  { label: "Total Area", value: `${totalSqft.toLocaleString()} SF`, color: C.accent2 },
                  { label: "Materials (est.)", value: `$${Math.round(totalCost * 0.55).toLocaleString()}`, color: C.accent },
                  { label: "Labor (est.)", value: `$${Math.round(totalCost * 0.45).toLocaleString()}`, color: C.accent3 },
                  { label: "Total Estimate", value: `$${Math.round(totalCost).toLocaleString()}`, color: "#f59e0b" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: "10px 14px", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</div>
                    {i === 3 && <div style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>📍 {location} · ×{mult.toFixed(2)}</div>}
                  </div>
                ))}
              </div>
              {/* Filter bar */}
              <div style={{ flexShrink: 0, padding: "7px 10px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", gap: 5, flexWrap: "wrap" }}>
                {categories.map(c => (
                  <button key={c} className="btn bg" style={{ fontSize: 11, padding: "3px 9px", background: bomFilter === c ? C.accent : C.panel, color: bomFilter === c ? "#000" : C.text, borderColor: bomFilter === c ? C.accent : C.border }} onClick={() => setBomFilter(c)}>{c}</button>
                ))}
              </div>
              {/* Table */}
              <div style={{ flex: 1, overflow: "auto" }}>
                <table>
                  <thead><tr><th>Category</th><th>Item</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Subtotal</th><th>Adjusted (×{mult.toFixed(2)})</th></tr></thead>
                  <tbody>
                    {filteredBOM.map((item, i) => (
                      <tr key={i}>
                        <td><span className="tag" style={{ background: `${C.accent2}20`, color: C.accent2 }}>{item.category}</span></td>
                        <td style={{ fontWeight: 500 }}>{item.item}</td>
                        <td>{item.qty.toLocaleString()}</td>
                        <td style={{ color: C.muted }}>{item.unit}</td>
                        <td>${item.unitCost.toLocaleString()}</td>
                        <td>${(item.qty * item.unitCost).toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: C.accent3 }}>${Math.round(item.qty * item.unitCost * mult).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: `${C.accent}0e` }}>
                      <td colSpan={6} style={{ fontWeight: 700, textAlign: "right", color: C.accent, padding: "9px 10px" }}>TOTAL ({location})</td>
                      <td style={{ fontWeight: 700, color: C.accent, fontSize: 14, padding: "9px 10px" }}>${Math.round(filteredBOM.reduce((s, i) => s + i.qty * i.unitCost * mult, 0)).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
                <div style={{ padding: "8px 10px", color: C.muted, fontSize: 11, borderTop: `1px solid ${C.border}` }}>
                  ⚠️ Estimates based on 2024 national averages with local multipliers. Actual costs vary significantly. Consult local contractors for accurate quotes.
                </div>
              </div>
            </>}
          </div>
        )}

        {/* ===== CODES TAB ===== */}
        {tab === "codes" && (
          <div style={{ flex: 1, overflow: "auto", padding: "18px 20px" }}>
            <div style={{ maxWidth: 740, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, marginBottom: 3 }}>Building Codes & Permits</div>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Look up local requirements, permits, and fees for your location</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Location</span>
                  <select value={location} onChange={e => setLocation(e.target.value)} className="ri" style={{ height: 34 }}>
                    {Object.keys(COST_MULTIPLIERS).map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <button className="btn bp" style={{ height: 34 }} onClick={lookupCodes}>{codesLoading ? "⏳ Looking up..." : "🔍 Look Up Codes"}</button>
              </div>

              {buildingCodes && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Applicable Code</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginTop: 2 }}>{buildingCodes.code}</div>
                    </div>
                    <span className="tag" style={{ background: `${C.accent3}20`, color: C.accent3 }}>📍 {location}</span>
                  </div>
                  <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Required Permits & Fees</div>
                  <table>
                    <thead><tr><th>Permit</th><th>Estimated Fee</th><th>Status</th></tr></thead>
                    <tbody>
                      {buildingCodes.permits.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{p.name}</td>
                          <td style={{ color: C.accent }}>{p.fee}</td>
                          <td><span className="tag" style={{ background: p.required ? `${C.red}20` : `${C.accent3}20`, color: p.required ? C.red : C.accent3 }}>{p.required ? "Required" : "Optional"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 9 }}>Key Code Requirements</div>
                  {buildingCodes.notes.map((n, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, marginBottom: 7 }}>
                      <span style={{ color: C.accent, flexShrink: 0 }}>▸</span>
                      <span style={{ fontSize: 13, lineHeight: 1.5 }}>{n}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 13, display: "flex", gap: 9 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                  <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                    Building codes and permit requirements change frequently. Always verify with your local building department before construction. Fees shown are estimates only. A licensed architect or contractor can help ensure compliance.
                  </div>
                </div>
              </div>}

              {!buildingCodes && !codesLoading && (
                <div style={{ textAlign: "center", padding: "50px 0", color: C.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                  <div>Select your location above and click "Look Up Codes"</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== SAVES TAB ===== */}
        {tab === "saves" && (
          <div style={{ flex: 1, overflow: "auto", padding: "18px 20px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, marginBottom: 14 }}>Saved Builds</div>
              {saves.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 0", color: C.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>💾</div>
                  <div>No saved builds yet — design something and save it from the Design tab!</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {saves.map((s, i) => (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                        <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                          {s.rooms?.length || 0} rooms · {(s.rooms?.reduce((a, r) => a + r.w * r.h, 0) || 0).toLocaleString()} SF · {s.date} · 📍 {s.location || "National Avg"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                        <button className="btn bs" style={{ fontSize: 12 }} onClick={() => loadSave(s)}>Load</button>
                        <button className="btn bd" style={{ fontSize: 12 }} onClick={() => setSaves(prev => { const n = prev.filter((_, j) => j !== i); try { localStorage.setItem("houseBuilds", JSON.stringify(n)); } catch {} return n; })}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Room Modal ── */}
      {showNewRoom && (
        <div style={{ position: "fixed", inset: 0, background: "#00000090", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowNewRoom(false)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, width: 300 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Add New Room</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div><span style={lbl}>Room Name</span><input className="ri" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} /></div>
              <div><span style={lbl}>Room Type</span>
                <select className="ri" value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}>
                  {["living","bedroom","kitchen","bath","dining","garage","utility","foyer"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                <div><span style={lbl}>Width (ft)</span><input className="ri" type="number" min={4} max={80} value={newRoom.w} onChange={e => setNewRoom({ ...newRoom, w: +e.target.value })} /></div>
                <div><span style={lbl}>Depth (ft)</span><input className="ri" type="number" min={4} max={80} value={newRoom.h} onChange={e => setNewRoom({ ...newRoom, h: +e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 2 }}>
                <button className="btn bp" style={{ flex: 1 }} onClick={addRoom}>Add Room</button>
                <button className="btn bg" onClick={() => setShowNewRoom(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
