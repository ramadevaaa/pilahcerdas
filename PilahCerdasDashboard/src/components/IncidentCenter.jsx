import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BALI_REGENCY_LIST } from '../lib/constants';
import { Card } from './ui/Card';
import { 
  AlertTriangle, CheckCircle2, Loader2, MapPin, 
  Trash2, Zap, Leaf, ShieldAlert, ArrowUpRight, 
  Filter, Search, Clock, ChevronRight, X, Calendar 
} from 'lucide-react';

// Rumus Haversine untuk jarak geografis
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Konversi koordinat Geospasial ke SVG Viewbox (500x300)
function mapCoordsToSvg(lat, lon) {
  const minLat = -8.95;
  const maxLat = -8.0;
  const minLon = 114.4;
  const maxLon = 115.8;

  const x = ((lon - minLon) / (maxLon - minLon)) * 500;
  const y = 300 - ((lat - minLat) / (maxLat - minLat)) * 300;

  return { x, y };
}

export function IncidentCenter() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  
  // Filter States
  const [selectedRegency, setSelectedRegency] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Incident for Detail Drawer
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Koordinator Path Peta Bali (Sama dengan ChoroplethMap)
  const regenciesPath = [
    { id: "Badung", name: "Badung", path: "M297.5,250.5 L296.9,249.5 L297.5,250.5 Z M266.7,215.3 L273.6,221.2 L279.6,229.9 L281.1,233.5 L282.2,238.8 L280.5,240.7 L278.7,246.2 L276.5,246.3 L276.5,247.3 L278.9,247.3 L281.7,249.7 L282.1,253 L280,257.6 L273.2,257.2 L269.5,260.4 L267.6,260.3 L266.4,261.8 L265.5,261.7 L264.6,264.9 L263.1,266 L255.5,268.6 L254,271.9 L255.1,275.8 L267.1,279.6 L275.9,279.3 L281.5,280 L287.8,278.8 L297.8,274.8 L303.3,265.8 L305.6,264.6 L304.3,264.1 L304.6,262.8 L303.4,263 L302.4,259.7 L301.2,258.9 L300.2,253.7 L298,254 L296.9,255.8 L297.9,258.8 L299,259.5 L297.2,259.5 L292.9,257.5 L291.3,258 L289.5,252.8 L287.6,251.4 L286.6,252.2 L285.9,249.8 L287.2,246.5 L288.8,246.5 L287.2,246.5 L287.2,245.3 L289.1,243.2 L288,242.2 L288,238.5 L287.3,237.9 L288.2,236.8 L288,234.5 L286.1,230.7 L284.4,229.4 L285.3,229.3 L285.7,228.2 L283.6,224.9 L285.6,222.5 L283.9,217.8 L284.8,217 L285,217.8 L285.9,217.6 L286.4,215.2 L286.4,205.6 L285.6,203 L285.6,203 L287.1,203.2 L288.6,201.9 L291.5,201.7 L291.1,199.7 L292.3,199.8 L297.1,196.4 L300.1,196.9 L300.9,196.4 L300.8,195.3 L304,195 L304.3,197.1 L305,197.3 L304.7,198.6 L306.4,198.7 L308.7,192.7 L308.6,189.3 L307.1,185.9 L307.1,183.9 L306,183.2 L305.2,180.5 L303.9,179.7 L303.4,177.6 L302.6,177.3 L303.2,174.4 L302.2,173.5 L302.5,170.3 L305,167.6 L304.8,165.6 L306.6,164.5 L305.6,161.8 L306.7,160.6 L306,160.1 L307.1,157.3 L306.2,156.8 L306.3,155.6 L307,155.4 L305.9,155 L306.3,153.2 L304.2,150.9 L302.1,146.6 L302.1,146.6 L303.4,141 L302.4,140.2 L302.4,138 L301.6,137.1 L301.7,129.9 L300.7,127.8 L301.6,126.4 L302.6,126.4 L302.8,124.6 L304,123.1 L303.3,121.5 L304.5,120 L303.6,117.8 L306.2,113.7 L306,112.8 L308.1,112.3 L308.6,111.3 L308.2,109.2 L306.6,107.9 L307.4,107.8 L307.1,105.9 L308.5,105.4 L308,104.4 L309.2,103.3 L306.7,97.2 L307.6,94.4 L307,92.3 L308.9,88.9 L309.2,86.2 L307.5,83.4 L306,82.6 L305.2,80.3 L303.9,79.7 L300.5,79.7 L295.1,81.4 L291.3,80.5 L286.8,80.6 L287.7,81.8 L288,85.5 L287.2,89.1 L292.8,96.4 L295.2,103 L294.7,106.3 L296.3,108.4 L296.2,109.2 L293.1,109.8 L293.5,115.1 L291.7,117.7 L292.9,122.7 L295.3,124.7 L294.9,127.3 L295.6,127.8 L296.3,133.7 L295.6,135.7 L298.3,144.5 L297.4,145.2 L296,150.8 L294.5,151.8 L294.8,152.6 L293.3,154.8 L293.8,158.8 L293.1,161.2 L290.6,160.8 L292,155.7 L291.2,152.3 L292.1,150.7 L291.7,146.8 L288.3,145.8 L288.1,146.7 L287,146.7 L285.5,148.4 L284,151 L283.7,152.8 L285.8,153.3 L284.6,160.4 L286.7,161.1 L286.5,164.5 L284.9,166.3 L281.7,175.3 L280.6,175.3 L279.8,181.5 L276.6,189.2 L276.9,190.4 L275.6,191.8 L275.5,195 L276.9,194.2 L276.3,195.3 L277.5,195.4 L277.8,197.8 L275.9,198.2 L275.9,200 L272.6,201.3 L272.4,202.7 L270.5,201.9 L271.8,201.4 L271.5,200.7 L268.8,200.4 L265.8,201.4 L264.7,203.3 L261.6,205.4 L259.1,209.5 L259.2,211 L263.2,212.7 L266.7,215.3 Z", labelX: 290.1, labelY: 195.3 },
    { id: "Bangli", name: "Bangli", path: "M357,149.9 L359.1,150.3 L359.5,148.8 L361.1,147.8 L362.2,145.8 L362.7,144.1 L362,143.6 L363.2,142.9 L363.3,138.6 L362.7,137.6 L363.8,132.8 L363.4,131.7 L361.2,130.3 L361,126.7 L359.5,125.3 L359.6,123.8 L357.4,120.4 L356.9,117.5 L358,117.2 L358,113.4 L359.4,113.5 L359.2,112.2 L361.8,111.1 L361.3,105.9 L364.2,105.4 L363.6,103.8 L365.5,102.7 L364.5,100.5 L365.8,99.4 L367,93.5 L368.8,90.8 L367.8,89.9 L368.3,87.8 L371.5,86.3 L374.6,83 L376.4,82.5 L377.2,81 L377.3,79.5 L374.3,80.8 L373.1,73.8 L371,71.6 L373.6,67.1 L376.1,65.3 L375.6,63.7 L370,59.2 L368.2,59.9 L367.8,61.8 L358.2,62.1 L355,61 L355.3,58.5 L351.6,56.2 L351.6,54.5 L350.1,53.6 L349.1,55.3 L347.7,54.6 L346.7,53 L347.7,50 L345.3,50.2 L345.9,47.6 L342.2,49.6 L338.2,46.8 L336.3,51.2 L332.6,47.2 L331,48.4 L330.9,51.2 L329.2,53.8 L326.8,55.3 L327.3,57.1 L323,55.3 L321.4,56.1 L319.7,55.6 L318.7,52.7 L315.8,54.5 L314.2,54.1 L310.4,58.6 L307.5,56.3 L306.3,61.5 L307.2,64 L306.6,69.3 L304.6,76.5 L303,79.5 L305.2,80.3 L306,82.6 L307.5,83.4 L309.2,86.2 L308.9,88.9 L307,92.3 L307.6,94.4 L306.7,97.2 L308.1,99.3 L308,101.5 L309.2,103.5 L311.7,103.6 L313,105 L313.6,106.7 L312.9,109.5 L315.7,106.1 L320.2,103.1 L322.3,104 L323.3,109.4 L326.6,110 L328,107.8 L330.3,108.4 L330.9,110.7 L332.7,108 L334.7,108.7 L334.3,111.3 L335.6,115.2 L335.3,117.8 L333.8,119.9 L334.7,120.1 L334.9,123 L336.4,120.4 L337.4,120.5 L337.3,123 L336.3,124.4 L337.6,125.6 L335.4,132.8 L335.5,136.4 L331.1,143.1 L333.5,148.9 L333,150.1 L334.3,153.1 L333.5,154.4 L334.5,159.6 L333.3,161.7 L335,164.9 L335,167.1 L336,167.7 L334.9,169 L336.7,170.3 L336.8,171.8 L340.3,172.9 L344.3,171.6 L343,167.9 L344.1,166.4 L344.5,162.2 L346.3,160.9 L346.3,159.4 L348,157.9 L347.2,156.5 L350.5,151.6 L353,152.1 L353.6,153.8 L357,149.9 Z", labelX: 343.1, labelY: 111.6 },
    { id: "Buleleng", name: "Buleleng", path: "M91.8,38.6 L91.8,38.6 Z M100.9,38.9 L100.9,38.9 Z M99.6,37.6 L99.6,37.6 Z M101.2,38.2 L99.9,37.5 L101.2,38.2 Z M66.8,30.2 L61.9,30.8 L66.9,32.7 L70.6,31 L70.1,30.1 L66.8,30.2 Z M365.3,49.8 L363.5,49.8 L359.9,46.8 L355,44.4 L344.5,42 L340.4,39 L338.5,36.5 L333,36.9 L328.2,34.6 L323.5,34.2 L317.4,31.3 L313.7,28.6 L307.1,27.1 L304.3,27.2 L294.1,24 L287.6,20 L277.9,21 L269.8,25.5 L264.7,26.5 L257.4,33 L252.1,35.7 L250.4,38.2 L247.6,39.9 L242.5,47 L236,50.4 L233.5,53.7 L229.2,54.6 L226.9,57.6 L224,57.9 L221.3,59.3 L215.3,59.9 L205.1,60.2 L202.6,59.3 L198.8,60.4 L195.5,59.9 L194.3,61.7 L190.9,61.8 L183.1,64.4 L177.9,64.1 L174.4,62.6 L172.3,63.7 L171.1,63 L171.1,61.5 L169.5,63 L168,63.1 L165.9,60.7 L163.4,61.1 L161.6,59.7 L153.6,57.1 L143.6,55.5 L139,52.6 L132.8,51.2 L132.2,50.6 L132.5,49.2 L131.4,50.9 L130.3,50.8 L125.1,47.2 L121.1,47.3 L118.2,48.3 L115.9,47.7 L115.1,46.7 L112.8,47.1 L109.3,42.8 L108.7,43.1 L109,44.2 L107.4,45.3 L105.4,42.7 L101,41.5 L100,40.1 L98.3,41.8 L98.3,43.4 L96.7,43.7 L95.5,45.3 L94.1,44.5 L92.5,45.6 L91.9,42.5 L92.7,40.4 L89.8,39.1 L87.3,39.7 L84,41.4 L84,42.5 L81.7,43.2 L81.6,44.7 L84.4,45.4 L83.7,46.2 L82,47 L80.5,45.2 L80.6,43.6 L79.6,42.9 L76.2,45.6 L74.6,46 L71.6,49.5 L68.8,50.7 L67.3,49.7 L67.7,47.6 L66.9,47.4 L68.9,45.4 L68.9,43.9 L61.4,33.6 L59.3,31.3 L57,30.5 L55.8,31.4 L45.3,30.2 L41.2,30.9 L39.5,33.5 L39,38.8 L42.7,43.7 L43.5,47 L43,51.4 L45.3,52.8 L47.6,52.4 L48,53.5 L49,53.2 L50.7,54.4 L47.7,56.3 L46.7,57.9 L46.6,61.5 L47,63.1 L48.1,63.8 L54.9,64.7 L59.3,63.5 L61.2,65.2 L63.2,65.6 L64.4,67.4 L67.6,67.3 L71.7,62.7 L78.8,64.9 L81.8,62.9 L85.2,62.2 L90.8,56.8 L91.3,58.2 L95.6,58.2 L98.7,60.5 L100.6,60.5 L104.9,70.1 L110,72.5 L111.5,74.2 L116.5,73 L118.6,73.3 L122.1,76.1 L124.2,72 L124.3,68.8 L128.1,65.1 L136.3,71.2 L143.1,73.4 L145.7,76.2 L148.2,82.2 L150.6,83.9 L150.6,85.5 L152.3,86.5 L154.7,85.3 L155.5,83.5 L158.9,84.3 L160.1,82.8 L162.9,82.9 L165.8,85.7 L165.3,87 L164.1,86.7 L163.8,87.5 L164.8,89.6 L164.5,91.7 L165.9,92.7 L165.5,95.2 L166.9,98.4 L166.4,103.7 L168.4,104.5 L167.6,106.4 L168.2,109.5 L173.1,111.1 L174.1,110.3 L177.1,110.7 L179.5,112.3 L181.4,110.3 L184,111.2 L192.2,117.7 L194.2,123.6 L201,126.1 L203.7,126.1 L204.2,125.3 L202.7,123.9 L204.9,117.4 L208.7,119 L209.8,118.6 L210.4,115.4 L211.6,113.8 L210.4,115.4 L211.6,113.8 L211.5,111.2 L213.2,109.1 L212.5,106.3 L214.5,102.6 L213.9,102 L214.7,100.5 L217.6,99.7 L220,97.9 L219.2,94.7 L221.7,95.2 L223.4,98.3 L224.9,98.4 L225.6,99.6 L228.6,100.8 L229.6,102.5 L231,100.7 L233.1,101.4 L234.4,98.9 L235.3,98.6 L240.8,101 L242.7,100.8 L245.8,102.1 L250.4,102.6 L255.2,102.2 L257.2,100.8 L259.7,101 L259.8,98.8 L261.3,97.9 L265.3,100.8 L267.2,101.2 L267.8,96.2 L270.9,88.7 L273.6,87.5 L274.9,85.7 L280.4,83.7 L283.8,79.5 L285.7,79.6 L286.8,80.6 L291.3,80.5 L293.6,81.4 L303.1,79.5 L306.6,69.3 L307.2,64 L306.3,61.5 L307.5,56.3 L310.4,58.6 L314.2,54.1 L315.8,54.5 L318.7,52.7 L319.7,55.6 L321.4,56.1 L323,55.3 L327.3,57.1 L326.8,55.3 L329.1,53.9 L330.7,51.6 L331,48.4 L333.1,47.4 L336.3,51.2 L338.2,46.8 L342.2,49.6 L345.9,47.6 L345.3,50.2 L347.7,50 L346.7,52.2 L347.7,54.6 L349.1,55.3 L350.1,53.6 L351.1,54.1 L352.1,55.1 L351.6,56.2 L355.3,58.5 L355,61 L358.2,62.1 L367.8,61.8 L368.3,59.8 L371,59.1 L372.2,58.3 L372.5,56.7 L377.3,54.5 L376.1,53.2 L372.3,51.6 L365.3,49.8 Z M97.6,40.2 L97.6,40.2 Z", labelX: 201, labelY: 62.4 },
    { id: "Denpasar", name: "Denpasar", path: "M303.1,238.2 L303.1,238.2 Z M301.5,239.3 L300.4,238.1 L301.5,237.3 L305.1,236.5 L307.4,234.3 L309.8,235 L313.5,232.7 L314.5,227.9 L313.5,224.9 L313.9,223.1 L312.4,219.7 L314.7,216 L317.1,214.3 L315.2,211.4 L314,211.4 L313.5,210 L312.2,209.7 L310.7,205.3 L306.8,201.4 L306.3,198.7 L304.7,198.6 L305,197.3 L304.3,197.1 L303.8,194.9 L300.8,195.3 L300.9,196.4 L300.1,196.9 L297.1,196.4 L295.6,197 L292.3,199.8 L291.1,199.7 L291.5,201.7 L288.6,201.9 L287.1,203.2 L285.6,203 L286.4,205.6 L286.4,215.2 L285.9,217.6 L285,217.8 L284.8,217 L283.9,217.8 L285.6,222.5 L283.6,225.2 L285.7,228.2 L285.3,229.3 L284.4,229.4 L286.1,230.7 L288,234.5 L288.2,236.8 L287.3,237.7 L288,238.5 L288,242.2 L289.1,243.2 L291.1,243.3 L291.4,241.9 L294,241.6 L293.9,240.4 L295.2,240.7 L296.1,242.2 L294.4,242.7 L294.9,243.5 L294.3,246 L296.3,246.2 L296.8,239.6 L301.3,239.6 L299.5,241.2 L298.2,246.4 L302.1,248.1 L303.9,245.9 L301.4,244.5 L301.9,242.4 L301.7,243.6 L304.3,245.2 L305.4,245.1 L306.9,243.7 L306.8,242.9 L307.8,242.6 L308.5,240 L307,241 L307,242 L304.5,243.1 L305.5,242.1 L305.3,241.3 L306.3,241 L305.3,239.8 L307.1,240.5 L307.1,239.1 L304.2,237.8 L302.1,238.7 L302.1,239.7 L301.5,239.3 Z", labelX: 303.2, labelY: 225.9 },
    { id: "Gianyar", name: "Gianyar", path: "M325.9,206.6 L327.6,204.6 L332.7,202.2 L334.5,199.3 L340.6,196 L344.2,191.1 L348.7,189.5 L348.8,186.7 L347.8,185 L346.8,185.1 L347.3,184.3 L346.4,181.1 L345.5,180.7 L346.3,179.6 L346.3,176.6 L345.3,175.2 L345.3,172.8 L344.4,172.5 L344.4,171.6 L340.3,172.9 L336.8,171.8 L336.7,170.3 L334.9,169 L336,167.7 L335,167.1 L335,164.9 L333.3,161.7 L334.5,159.6 L333.5,154.4 L334.3,153.1 L331.1,142.9 L332.9,141.2 L335.5,136.4 L335.4,132.8 L337.6,125.6 L336.3,124.4 L337.3,123 L337.4,120.5 L336.4,120.4 L334.9,123 L334.7,120.1 L333.8,119.9 L335.3,117.8 L335.6,115.2 L334.3,111.3 L334.7,108.7 L332.7,108 L330.9,110.7 L330.3,108.4 L328,107.8 L326.6,110 L323.3,109.4 L322.3,104 L320.2,103.1 L315.7,106.1 L312.9,109.5 L313.6,106.7 L313,105 L311.7,103.6 L309.1,103.4 L308,104.4 L308.5,105.4 L307.1,105.9 L307.4,107.8 L306.6,107.9 L308.2,109.2 L308.6,111.3 L308.1,112.3 L306,112.8 L306.2,113.7 L303.6,117.8 L304.5,120 L303.3,121.5 L304,123.1 L302.8,124.6 L302.6,126.4 L301.6,126.4 L300.7,127.8 L301.7,129.9 L301.6,137.1 L302.4,138 L302.4,140.2 L303.4,141 L302.1,146.6 L304.2,150.9 L306.3,153.2 L305.9,155 L307,155.4 L306.3,155.6 L306.2,156.8 L307.1,157.3 L306,160.1 L306.7,160.6 L305.6,161.8 L306.6,164.5 L304.8,165.6 L305,167.6 L302.5,170.3 L302.2,173.5 L303.2,174.4 L302.6,177.3 L303.4,177.6 L303.9,179.7 L305.2,180.5 L306,183.2 L307.1,183.9 L307.1,185.9 L308.6,189.3 L308.7,192.7 L306.3,198.7 L306.5,200.4 L307.2,202 L310.7,205.3 L312.2,209.7 L313.5,210 L314,211.4 L315.2,211.4 L317.1,214.3 L322.1,210.6 L325.9,206.6 Z", labelX: 320.4, labelY: 163 },
    { id: "Jembrana", name: "Jembrana", path: "M107.5,133.8 L115.8,132 L127.5,130.7 L138.3,130.3 L145.8,131.8 L160.2,135.9 L161.8,137.1 L162.2,138.7 L165.6,140.1 L166.1,141.9 L168.5,143.2 L177.2,144.1 L178.9,145.6 L185.9,148.2 L187.8,148.2 L197.9,153.8 L199,152.3 L198.7,150.7 L201.5,147.7 L201,146.1 L202.1,143.6 L201.1,142.5 L201.6,139.9 L200.6,138.3 L202.2,134 L204.3,131.5 L204.5,128.9 L202.9,127 L202.9,125.9 L201,126.1 L194.2,123.6 L192.2,117.7 L184,111.2 L181.4,110.3 L179.5,112.3 L177.1,110.7 L174.1,110.3 L173.1,111.1 L168.2,109.5 L167.6,106.4 L168.4,104.5 L166.4,103.7 L166.9,98.4 L165.5,95.2 L165.9,92.7 L164.5,91.7 L164.8,89.6 L163.8,87.5 L164.1,86.7 L165.3,87 L165.8,85.7 L163.6,83.4 L160.9,82.6 L158.9,84.3 L155.5,83.5 L154.7,85.3 L152.3,86.5 L150.6,85.5 L150.6,83.9 L148.2,82.2 L145.7,76.2 L143.1,73.4 L136.3,71.2 L128.1,65.1 L124.3,68.8 L124.2,72 L122,76.1 L118.6,73.3 L116.5,73 L111.5,74.2 L109.5,72.2 L106.6,71.4 L104.9,70.1 L100.6,60.5 L98.7,60.5 L95.6,58.2 L91.3,58.2 L90.8,56.8 L85.2,62.2 L81.8,62.9 L78.8,64.9 L71.7,62.7 L67.6,67.3 L64.8,67.5 L63.2,65.6 L61.2,65.2 L59.3,63.5 L54.9,64.7 L47.6,63.6 L46.6,61.5 L46.7,57.9 L48,54.9 L45.1,58.4 L44.1,58.7 L45.9,56.5 L45.2,57 L44.7,56.4 L43.7,58.7 L42.4,59.1 L42,58.3 L43.1,57.8 L43.3,56.2 L42,54.4 L43.9,54.2 L45.2,55.1 L45.5,54.2 L43,53.4 L41.5,54.1 L40.9,53.5 L41.3,52.7 L40.5,52.7 L38.6,56.4 L39.2,58.7 L41.3,61.5 L43.9,71.2 L46.2,75.5 L51.2,81 L56.1,91 L67,100.7 L68.1,103.4 L67.4,107 L68.4,109.4 L75.9,114.2 L76.3,116.6 L86.2,126.5 L85.5,127 L88.1,131.1 L93.4,132.8 L95.7,131.8 L96,132.8 L101.7,134.2 L107.5,133.8 Z", labelX: 125.8, labelY: 103 },
    { id: "Karangasem", name: "Karangasem", path: "M410.4,166.7 L417.9,169.6 L418.1,170.5 L426.3,165.9 L428.5,166.8 L427.7,165.7 L428.4,164.1 L429,164.2 L428.6,163 L430.1,159.5 L434.9,155.4 L436,152.2 L442.4,149.4 L445.5,147.1 L448.1,146.6 L453.6,142.4 L456.3,137.9 L457.5,137.7 L457.5,136.1 L461.1,131.9 L461,124.3 L458.2,121.4 L456.8,117.9 L453.9,116.7 L451.4,114.2 L447.5,112.9 L445.6,111 L444.2,111.4 L443.5,110.3 L438.5,109.8 L434.5,106.9 L431,100.8 L430.6,98.7 L427.4,96.1 L425.9,93.4 L422.7,91.4 L418.1,83.7 L411.4,76.6 L394.5,67.4 L391.8,63.3 L388.3,61.6 L386.2,59 L381.7,58.4 L378.1,55.9 L377.3,54.5 L376.4,54.7 L372.5,56.7 L372.2,58.3 L370.3,59.5 L373,62.1 L374.2,62.1 L376.1,65 L373.6,67.1 L371,71.6 L373.1,73.8 L374.3,80.8 L377.3,79.5 L377.2,81 L376.4,82.5 L374.6,83 L371.5,86.3 L368.3,87.8 L367.8,89.9 L368.8,90.8 L367,93.5 L365.8,99.4 L364.5,100.5 L365.5,102.7 L363.6,103.8 L364.2,105.4 L361.3,105.9 L361.8,111.1 L359.2,112.2 L359.4,113.5 L358,113.4 L358,117.2 L356.9,117.5 L357.4,120.4 L359.6,123.8 L359.5,125.3 L361,126.7 L361.2,130.3 L363.4,131.7 L363.8,132.8 L362.7,137.6 L363.3,138.6 L363.2,142.9 L362,143.6 L362.7,144.5 L361.1,147.8 L359.5,148.8 L359.4,152.1 L356.5,155.3 L355,158.9 L357.8,158.1 L359.3,156.8 L359.8,157.4 L360.4,156.1 L362.3,155.6 L363.1,156.2 L361.8,158 L362.1,159.9 L361.5,160.4 L363.4,165.7 L363.3,167.7 L360.1,169.8 L361.1,171.3 L360.5,172.7 L361.6,174.6 L362.6,172.4 L369.6,171 L377.6,165.7 L380.1,166.5 L383.6,171.4 L383.1,177 L385,179.4 L384.5,181.5 L394.5,178 L394.9,176.5 L394.2,175.5 L395.4,174.9 L395.9,176.1 L396.4,174.5 L394,171 L394,169.5 L398,166.2 L403.1,164.8 L406.3,166.5 L410.4,166.7 Z", labelX: 392.9, labelY: 126.4 },
    { id: "Klungkung", name: "Klungkung", path: "M418.2,269.4 L418.2,269.4 Z M422.6,269.3 L422.5,268.8 L422.6,269.3 Z M434.2,257.3 L434.2,257.3 Z M434.2,256.8 L434,255.8 L434.2,256.8 Z M399.8,265.2 L399.9,264.5 L399.8,265.2 Z M375.4,247.4 L375.4,247.4 Z M382.5,248.6 L382.5,248.6 Z M384.3,250.1 L384.3,250.1 Z M387.2,254 L387.2,254 Z M386.2,254.8 L386.2,254.8 Z M376.4,243.2 L376.4,243.2 Z M377.1,235.7 L377.1,235.7 Z M380,226.8 L378,226.8 L374.5,229.9 L372,230.9 L370.6,233.5 L371.7,233.8 L371.6,234.7 L372.9,234.8 L373,233.7 L373.7,234.1 L374.6,232.6 L378.3,230.1 L380,226.8 Z M380.3,219.5 L375.2,218.5 L373.3,223.9 L370.7,224.6 L369.9,224 L369.1,225.1 L367.3,225.1 L367.9,227.8 L369.3,227.7 L370.7,228.9 L375.1,228.7 L382.1,222.6 L382.2,220.6 L380.3,219.5 Z M388.8,254.9 L388.8,254.9 Z M399.1,260.6 L399.1,260.6 Z M430.9,256.9 L430.9,256.9 Z M396.8,257.4 L399.1,259.5 L399.1,261 L400.3,261.4 L400.8,263.5 L403.2,262.9 L404.4,263.4 L404.2,264 L405.4,263.4 L406.9,263.8 L408.3,264.6 L408.2,265.3 L410.6,265.1 L411.8,266.4 L413,266.4 L414,268 L416.9,267.9 L418.7,269.8 L420.5,270.2 L424.3,266.3 L426.8,266.4 L425.9,263.3 L426.8,262.1 L426.3,260.8 L431.5,255 L433.8,254.7 L433.1,254.4 L433.7,253.3 L432,250.4 L432.6,250.6 L432.8,249.7 L431.4,246.8 L427.8,242.4 L423.7,239.4 L422.7,236 L419.2,232.3 L417.5,226.1 L415.4,223.4 L412.2,221.5 L408.3,221.5 L401.4,223.3 L388.6,221.7 L386.9,225.4 L383.4,226.7 L382.3,227.7 L382.2,229.3 L379.7,230.9 L379.8,232.9 L379,232.8 L377.2,234.8 L377.9,236.2 L376.4,236.4 L376.9,237.1 L375.8,236.6 L375.9,237.4 L375.3,237 L374.1,238 L374,239.5 L375.4,240.5 L373.8,241.8 L375.6,241.8 L375.6,242.8 L376.7,243 L375.8,244.3 L376.6,244.7 L375.1,245.6 L375.3,246.7 L380.3,246 L382.4,247.4 L381.7,248.4 L383.3,247.9 L385.4,250.8 L386.8,250.8 L386.4,253.5 L388.2,253.6 L389.2,254.9 L390.3,254 L391.4,255.6 L394.9,255.9 L396.8,257.4 Z M432,255.2 L432.9,256.1 L434,255.5 L432,255.2 Z M400.6,263.5 L400.6,263.5 Z M400.7,263.4 L400.7,263.4 Z M400.4,263.9 L400.4,263.9 Z M400.9,263.6 L400.9,263.6 Z M375.6,186.5 L379.1,183 L384.7,181 L384.7,178.5 L383.1,177 L383.6,171.4 L381.5,169.1 L381.2,167.6 L379.4,166 L377.6,165.7 L369.6,171 L362.6,172.4 L361.6,174.6 L360.5,172.7 L361.1,171.3 L360.1,169.8 L363.3,167.7 L363.4,165.7 L361.5,160.4 L362.1,159.9 L361.8,158 L363.1,156.2 L362.3,155.6 L360.4,156.1 L359.8,157.4 L359.3,156.8 L355.2,159.1 L356.5,155.3 L359.4,152.1 L359.1,150.3 L357,149.9 L353.6,153.8 L353,152.1 L350.5,151.6 L347.2,156.5 L348,157.9 L346.3,159.4 L346.3,160.9 L344.5,162.2 L344.1,166.4 L343,167.9 L344.3,170.4 L344.4,172.5 L345.3,172.8 L345.3,175.2 L346.2,176.1 L346.3,179.6 L345.5,180.7 L346.4,181.1 L347.3,184.3 L346.8,185.1 L347.8,185 L348.8,186.7 L348.7,189.3 L359.1,190.3 L366.8,189.8 L374,188.2 L375.6,186.5 Z", labelX: 356, labelY: 170.4 },
    { id: "Tabanan", name: "Tabanan", path: "M276.3,195.2 L276.9,194.2 L275.5,195 L275.6,191.8 L276.9,190.4 L276.6,189.2 L279.8,181.5 L280.6,175.3 L281.7,175.3 L284.9,166.3 L286.5,164.5 L286.7,161.1 L284.6,160.4 L285.8,153.3 L283.7,152.8 L284,151 L285.5,148.4 L287,146.7 L288.1,146.7 L288.3,145.8 L291.7,146.8 L292.1,150.7 L291.2,152.3 L292,155.7 L290.6,160.8 L293.1,161.2 L293.8,158.8 L293.3,154.8 L294.8,152.6 L294.5,151.8 L296,150.8 L297.4,145.2 L298.3,144.5 L295.6,135.7 L296.3,133.7 L295.6,127.8 L294.9,127.3 L295.3,124.7 L292.9,122.7 L291.7,117.7 L293.5,115.1 L293.1,109.8 L296.3,109 L294.7,106.3 L295.2,103 L292.8,96.4 L287.2,89.1 L288,86.9 L287.6,81.4 L284.8,79.4 L283.8,79.5 L280.4,83.7 L274.9,85.7 L273.6,87.5 L270.9,88.7 L267.8,96.2 L267.2,101.2 L265.3,100.8 L261.3,97.9 L259.8,98.8 L259.7,101 L257.2,100.8 L255.2,102.2 L250.4,102.6 L245.8,102.1 L242.7,100.8 L240.8,101 L235.3,98.6 L234.4,98.9 L233.1,101.4 L231,100.7 L229.6,102.5 L228.6,100.8 L225.6,99.6 L224.9,98.4 L223.4,98.3 L221.7,95.2 L219,94.8 L220,97.9 L217.6,99.7 L214.7,100.5 L213.9,102 L214.5,102.6 L212.5,106.3 L213.2,109.1 L211.5,111.2 L211.6,113.8 L210.4,115.4 L209.8,118.6 L208.7,119 L204.9,117.4 L204.9,118.8 L203.7,119.7 L202.7,124.1 L204.2,125.3 L203.7,126.1 L202.9,125.9 L202.8,126.8 L204.4,128.5 L204.3,131.5 L202.2,134 L200.6,138.3 L201.6,139.9 L201.1,142.5 L202.1,143.6 L201,146.1 L201.5,147.7 L198.7,150.7 L199,152.3 L198,153.2 L204.6,157.1 L210.9,163.8 L217.3,167.1 L218.5,169.2 L221.2,170.5 L224.7,173.8 L225.6,177.1 L228.9,178.7 L229.6,178.2 L230.7,180.7 L241.2,187.6 L243.3,190.1 L245.7,191.1 L253.9,200.6 L254.8,204.4 L259.1,209.6 L261.6,205.4 L264.7,203.3 L265.8,201.4 L268.8,200.4 L271.5,200.7 L271.8,201.4 L270.5,201.9 L272.4,202.7 L272.6,201.3 L275.9,200 L275.7,198.4 L277.6,198.1 L278,197 L277.5,195.4 L276.3,195.2 Z", labelX: 249.3, labelY: 146.7 }
  ];

  useEffect(() => {
    fetchIncidents();

    if (!isSupabaseConfigured || !supabase) return;

    // Dengarkan perubahan tabel secara real-time
    const channel = supabase
      .channel('realtime_laporan_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pilah_laporan' },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      // Mock data jika Supabase belum tersambung
      setIncidents([
        {
          id: 'mock_1',
          kategori: 'tumpukan_liar',
          deskripsi: 'Sampah plastik menumpuk di depan pura dekat pohon beringin.',
          kabupaten: 'Badung',
          kecamatan: 'Kuta',
          desa: 'Legian',
          foto_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80',
          latitude: -8.706,
          longitude: 115.178,
          status: 'baru',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'mock_2',
          kategori: 'pembakaran_terbuka',
          deskripsi: 'Pembakaran sampah plastik ilegal sore hari asap sangat pekat.',
          kabupaten: 'Denpasar',
          kecamatan: 'Denpasar Selatan',
          desa: 'Sanur',
          foto_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80',
          latitude: -8.685,
          longitude: 115.255,
          status: 'proses',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pilah_laporan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (e) {
      console.error('Gagal mengambil data aduan:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (newStatus === 'selesai') {
      const isConfirmed = window.confirm('Yakin status penanganan aduan ini selesai? Tindakan ini menyatakan bahwa tumpukan sampah di lokasi kejadian telah dibersihkan secara tuntas oleh petugas DLH/TPS3R.');
      if (!isConfirmed) return;
    }

    if (!isSupabaseConfigured || !supabase) {
      // Mock update local state
      setIncidents(prev => 
        prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc)
      );
      if (selectedGroup && selectedGroup.items.some(item => item.id === id)) {
        setSelectedGroup(null); // Tutup drawer untuk reset detail
      }
      return;
    }

    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('pilah_laporan')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state instan
      setIncidents(prev => 
        prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc)
      );
      setSelectedGroup(null); // Tutup laci aduan setelah update status
    } catch (e) {
      console.error('Gagal meng-update status aduan:', e);
      alert('Gagal memperbarui status. Pastikan akun Anda terdaftar sebagai Admin DLH.');
    } finally {
      setUpdatingId('');
    }
  };

  // 1. Dapatkan daftar laporan terfilter
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchesRegency = !selectedRegency || inc.kabupaten === selectedRegency;
      const matchesCategory = filterCategory === 'all' || inc.kategori === filterCategory;
      const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
      const matchesSearch = !searchTerm || 
        inc.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.desa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.kecamatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.banjar?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesRegency && matchesCategory && matchesStatus && matchesSearch;
    });
  }, [incidents, selectedRegency, filterCategory, filterStatus, searchTerm]);

  // 2. Klasterisasi Aduan Otomatis (Radius < 30 Meter)
  const clusteredIncidents = useMemo(() => {
    const groups = [];
    filteredIncidents.forEach(inc => {
      let foundGroup = false;
      for (const g of groups) {
        const dist = getDistanceMeters(inc.latitude, inc.longitude, g.latitude, g.longitude);
        // Gabungkan jika kategori, status sama, dan jarak < 30 meter
        if (dist < 30 && inc.kategori === g.kategori && inc.status === g.status) {
          g.items.push(inc);
          foundGroup = true;
          break;
        }
      }
      if (!foundGroup) {
        groups.push({
          id: inc.id,
          latitude: inc.latitude,
          longitude: inc.longitude,
          kategori: inc.kategori,
          status: inc.status,
          kabupaten: inc.kabupaten,
          kecamatan: inc.kecamatan,
          desa: inc.desa,
          banjar: inc.banjar,
          items: [inc]
        });
      }
    });
    return groups;
  }, [filteredIncidents]);

  // Format Helper Kategori
  const getKategoriMeta = (kategori) => {
    switch (kategori) {
      case 'tumpukan_liar':
        return { label: 'Sampah Menumpuk', color: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' };
      case 'tps_penuh':
        return { label: 'TPS Penuh / Lambat', color: 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20' };
      case 'pembakaran_terbuka':
        return { label: 'Pembakaran Sampah', color: 'text-red-600 bg-red-50 border-red-200' };
      case 'sungai_tercemar':
        return { label: 'Sampah di Sungai', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      default:
        return { label: 'Aduan Lingkungan', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'baru':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20 uppercase">Baru Masuk</span>;
      case 'proses':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-yellow/15 text-yellow-700 border border-brand-yellow/30 uppercase">Diatensi</span>;
      case 'selesai':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2d7a4f] border border-[#2d7a4f]/20 uppercase">Selesai Bersih</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Filter Kendali Utama */}
      <div className="bg-white border border-brand-light rounded-3xl p-5 shadow-premium flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-brand-primary font-bold block uppercase tracking-wider">Layanan Pengaduan Sipil</span>
            <h2 className="text-xl font-extrabold text-brand-dark font-display flex items-center gap-2 mt-0.5">
              <ShieldAlert className="w-5.5 h-5.5 text-brand-orange animate-pulse" />
              Pusat Investigasi Pengaduan Warga Bali
            </h2>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRegency}
              onChange={(e) => setSelectedRegency(e.target.value)}
              className="px-3.5 py-2 bg-brand-light/40 border border-brand-light rounded-xl font-bold text-brand-dark text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer"
            >
              <option value="">-- Semua Kabupaten --</option>
              {BALI_REGENCY_LIST.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3.5 py-2 bg-brand-light/40 border border-brand-light rounded-xl font-bold text-brand-dark text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer"
            >
              <option value="all">Semua Jenis Isu</option>
              <option value="tumpukan_liar">Sampah Menumpuk</option>
              <option value="tps_penuh">TPS Penuh</option>
              <option value="pembakaran_terbuka">Pembakaran Sampah</option>
              <option value="sungai_tercemar">Sampah di Sungai</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-2 bg-brand-light/40 border border-brand-light rounded-xl font-bold text-brand-dark text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="baru">Baru Masuk</option>
              <option value="proses">Diatensi</option>
              <option value="selesai">Selesai Bersih</option>
            </select>
          </div>
        </div>

        {/* Search Bar Patokan */}
        <div className="relative w-full">
          <Search className="absolute left-4.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-brand-textSecondary" />
          <input
            type="text"
            placeholder="Cari kata kunci deskripsi patokan, banjar, desa adat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#F9FBF9] border border-brand-light rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all placeholder-gray-400"
          />
        </div>
      </div>

      {/* 2. Grid Utama: Peta Pinpoint & Laci Drawer Samping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Kolom Kiri: Peta Spasial Laporan Sampah */}
        <div className="lg:col-span-2 bg-white border border-brand-light rounded-3xl p-5 shadow-premium flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4 border-b border-brand-light pb-3">
            <div>
              <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Crowdsourced GIS Monitoring</span>
              <h3 className="text-base font-extrabold text-brand-dark mt-0.5">Peta Titik Aduan Real-Time</h3>
            </div>
            <div className="text-[9px] font-bold text-brand-textSecondary bg-[#F9FBF9] border border-brand-light px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              Auto-Merge radius &lt; 30m aktif
            </div>
          </div>

          <div className="relative w-full aspect-[5/3] bg-emerald-50/10 border border-brand-light/50 rounded-2xl overflow-hidden p-2 shadow-inner">
            <svg viewBox="0 0 500 300" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="mapShadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="-1" dy="2.5" stdDeviation="3.5" flood-color="#113F1F" flood-opacity="0.08" />
                </filter>
              </defs>

              <g filter="url(#mapShadow)">
                {regenciesPath.map((reg) => {
                  const isFocused = selectedRegency === reg.id;
                  return (
                    <path
                      key={reg.id}
                      d={reg.path}
                      fill={isFocused ? '#C2E5D0' : '#E2ECE5'}
                      stroke={isFocused ? '#F5A623' : '#FFFFFF'}
                      strokeWidth={isFocused ? '2.0' : '1.0'}
                      className="transition-all duration-300 hover:fill-[#C2E5D0]"
                      onClick={() => setSelectedRegency(isFocused ? '' : reg.id)}
                    />
                  );
                })}

                {/* Render Pinpoint Aduan Terklaster / Auto-Merged */}
                {clusteredIncidents.map((group) => {
                  const svgPos = mapCoordsToSvg(group.latitude, group.longitude);
                  const isSelected = selectedGroup && selectedGroup.id === group.id;
                  
                  // Warna pin berdasarkan kategori laporan
                  let pinColor = '#EF4444'; // Merah untuk pembakaran
                  if (group.kategori === 'tumpukan_liar') pinColor = '#e05c2a'; // Oranye
                  if (group.kategori === 'tps_penuh') pinColor = '#f5a623'; // Kuning
                  if (group.kategori === 'sungai_tercemar') pinColor = '#3B82F6'; // Biru

                  return (
                    <g
                      key={group.id}
                      className="cursor-pointer group/pin"
                      onClick={() => setSelectedGroup(group)}
                    >
                      {/* Aura Pulser Lingkaran */}
                      <circle
                        cx={svgPos.x}
                        cy={svgPos.y}
                        r={isSelected ? '12' : '7'}
                        fill={pinColor}
                        opacity={isSelected ? '0.35' : '0.15'}
                        className="animate-pulse"
                      />

                      {/* Pin Center */}
                      <circle
                        cx={svgPos.x}
                        cy={svgPos.y}
                        r={isSelected ? '5.5' : '3.8'}
                        fill={pinColor}
                        stroke="#FFFFFF"
                        strokeWidth="1.2"
                        className="transition-all duration-200 group-hover/pin:scale-125"
                      />

                      {/* Jumlah Laporan Terklaster Badge */}
                      {group.items.length > 1 && (
                        <g>
                          <rect
                            x={svgPos.x + 4}
                            y={svgPos.y - 12}
                            width="9"
                            height="9"
                            rx="2.5"
                            fill="#1A4A30"
                            stroke="#FFFFFF"
                            strokeWidth="0.8"
                          />
                          <text
                            x={svgPos.x + 8.5}
                            y={svgPos.y - 5.5}
                            className="fill-white text-[6px] font-black text-center"
                            textAnchor="middle"
                          >
                            {group.items.length}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Kolom Kanan: Detail Drawer Aduan Aktif */}
        <div className="lg:col-span-1">
          {selectedGroup ? (
            <Card padding="md" className="border-brand-orange/30 shadow-premium flex flex-col space-y-4 animate-fade-slide">
              <div className="flex items-center justify-between border-b border-brand-light pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-brand-orange animate-bounce-subtle" />
                  <h4 className="font-extrabold text-brand-dark text-xs uppercase tracking-wider font-display">Aduan Warga Terpilih</h4>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-1 rounded-lg hover:bg-brand-light text-brand-textSecondary border-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cluster items list */}
              <div className="space-y-4 overflow-y-auto max-h-[40vh] scrollbar-none pr-1">
                {selectedGroup.items.map((inc, i) => {
                  const meta = getKategoriMeta(inc.kategori);
                  const date = new Date(inc.created_at);
                  return (
                    <div key={inc.id} className={`p-4 rounded-2xl border bg-[#F9FBF9] ${i > 0 ? 'mt-4 border-dashed border-brand-light' : 'border-brand-light'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-brand-textSecondary font-semibold">
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Foto Bukti */}
                      <div className="relative rounded-xl overflow-hidden border border-brand-light aspect-video mb-3">
                        <img src={inc.foto_url} alt="Foto Pengaduan" className="w-full h-full object-cover" />
                        <a 
                          href={inc.foto_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 shadow-sm no-underline"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Buka Foto
                        </a>
                      </div>

                      <p className="text-xs font-semibold text-brand-dark leading-relaxed">
                        &ldquo;{inc.deskripsi || 'Tidak ada deskripsi tertulis.'}&rdquo;
                      </p>

                      <div className="mt-3 pt-3 border-t border-brand-light flex items-center justify-between text-[10px] font-bold text-brand-textSecondary">
                        <span>📍 Kec. {inc.kecamatan}, Desa {inc.desa}</span>
                        {inc.banjar && <span>Banjar {inc.banjar}</span>}
                      </div>

                      {/* Tombol Atensi / Aksi Perubahan Status */}
                      <div className="mt-4 pt-3 border-t border-brand-light flex flex-col gap-2">
                        <p className="text-[9px] text-brand-textSecondary font-bold uppercase tracking-wider">Perbarui Status Atensi DLH:</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['baru', 'proses', 'selesai'].map((statusOption) => (
                            <button
                              key={statusOption}
                              disabled={updatingId === inc.id}
                              onClick={() => handleUpdateStatus(inc.id, statusOption)}
                              className={`py-1.5 rounded-xl text-[9px] font-bold transition-all border cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
                                inc.status === statusOption
                                  ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                  : 'bg-white hover:bg-brand-light text-brand-dark/70 border-brand-light shadow-sm'
                              }`}
                            >
                              {updatingId === inc.id && inc.status === statusOption ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  {statusOption === 'baru' && 'Baru'}
                                  {statusOption === 'proses' && 'Proses'}
                                  {statusOption === 'selesai' && 'Selesai'}
                                </>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card padding="md" className="text-center py-12 flex flex-col items-center">
              <div className="w-12 h-12 bg-[#F9FBF9] border border-brand-light text-brand-textSecondary rounded-2xl flex items-center justify-center mb-4 animate-pulse-slow">
                <MapPin className="w-5.5 h-5.5" />
              </div>
              <h4 className="font-extrabold text-brand-dark text-xs uppercase tracking-wider block">Laci Detail Pengaduan</h4>
              <p className="text-[11px] text-brand-textSecondary max-w-xs mt-2 leading-relaxed">
                Pilih atau klik salah satu titik pin aduan warga pada peta Bali di samping untuk mengatensi dan merubah status laporan.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* 3. Tabel Riwayat & Laporan Audit Pengaduan Warga */}
      <Card>
        <div className="flex items-center justify-between mb-4 border-b border-brand-light pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <h3 className="text-base font-extrabold text-brand-dark font-display">Tabel Log Audit Laporan Warga</h3>
          </div>
          <span className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">
            Total Laporan: {filteredIncidents.length} kasus
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-light/60 text-brand-textSecondary border-b border-brand-light font-bold">
                <th className="py-3 px-4 font-bold">ID Aduan</th>
                <th className="py-3 px-4 font-bold">Waktu Pelaporan</th>
                <th className="py-3 px-4 font-bold">Kategori</th>
                <th className="py-3 px-4 font-bold">Lokasi Aduan</th>
                <th className="py-3 px-4 font-bold">Deskripsi Patokan</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-brand-textSecondary font-semibold">
                    Tidak ada data aduan yang cocok dengan filter aktif Anda.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const meta = getKategoriMeta(inc.kategori);
                  const date = new Date(inc.created_at);
                  const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={inc.id} className="border-b border-brand-light/40 hover:bg-[#F9FBF9] transition-all">
                      <td className="py-3.5 px-4 font-bold text-brand-primary select-all">#{inc.id.substring(0, 8)}</td>
                      <td className="py-3.5 px-4 font-medium text-brand-textSecondary">{formattedDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-dark">
                        {inc.kabupaten} <span className="text-[10px] text-brand-textSecondary font-medium block">Kec. {inc.kecamatan}, Desa {inc.desa}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-brand-textSecondary font-medium" title={inc.deskripsi}>
                        {inc.deskripsi || '-'}
                      </td>
                      <td className="py-3.5 px-4">{getStatusLabel(inc.status)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            // Mencari klaster group terkait
                            const g = clusteredIncidents.find(grp => grp.items.some(item => item.id === inc.id));
                            if (g) setSelectedGroup(g);
                          }}
                          className="px-2.5 py-1 bg-brand-light hover:bg-brand-primary/10 text-brand-primary font-bold rounded-lg border border-brand-primary/5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          Atensi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
