import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-candle-bg',
  standalone: true,
  template: `
    <svg class="candle-bg" [style.opacity]="opacity" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid -->
      <line x1="0" y1="180" x2="1600" y2="180" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="0" y1="360" x2="1600" y2="360" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="0" y1="540" x2="1600" y2="540" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="0" y1="720" x2="1600" y2="720" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="267" y1="0" x2="267" y2="900" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="533" y1="0" x2="533" y2="900" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="800" y1="0" x2="800" y2="900" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="1067" y1="0" x2="1067" y2="900" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>
      <line x1="1333" y1="0" x2="1333" y2="900" stroke="#1e2d3d" stroke-width="0.5" stroke-dasharray="4,8"/>

      <!-- C1 small bull -->
      <line x1="30" y1="720" x2="30" y2="650" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="23" y="670" width="14" height="30" fill="#0ea5e9" rx="1"/>
      <!-- C2 hammer -->
      <line x1="65" y1="740" x2="65" y2="610" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="57" y="620" width="16" height="25" fill="#0ea5e9" rx="1"/>
      <!-- C3 big bull -->
      <line x1="100" y1="660" x2="100" y2="510" stroke="#0ea5e9" stroke-width="1.5"/>
      <rect x="90" y="530" width="20" height="110" fill="#0ea5e9" rx="2"/>
      <!-- C4 doji -->
      <line x1="132" y1="560" x2="132" y2="470" stroke="#c7e2f7" stroke-width="1"/>
      <rect x="125" y="512" width="14" height="4" fill="#c7e2f7" rx="1"/>
      <!-- C5 bull medium -->
      <line x1="164" y1="540" x2="164" y2="420" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="156" y="450" width="16" height="60" fill="#0ea5e9" rx="1"/>
      <!-- C6 small bear -->
      <line x1="196" y1="490" x2="196" y2="400" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="189" y="410" width="14" height="45" fill="#6366f1" rx="1"/>
      <!-- C7 big bull wide -->
      <line x1="230" y1="480" x2="230" y2="300" stroke="#0ea5e9" stroke-width="1.5"/>
      <rect x="219" y="320" width="22" height="130" fill="#0ea5e9" rx="2"/>
      <!-- C8 tiny bear -->
      <line x1="262" y1="380" x2="262" y2="320" stroke="#6366f1" stroke-width="1"/>
      <rect x="256" y="335" width="12" height="25" fill="#6366f1" rx="1"/>
      <!-- C9 shooting star -->
      <line x1="294" y1="380" x2="294" y2="210" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="287" y="340" width="14" height="30" fill="#6366f1" rx="1"/>
      <!-- C10 tall bull -->
      <line x1="326" y1="350" x2="326" y2="180" stroke="#0ea5e9" stroke-width="1.5"/>
      <rect x="317" y="200" width="18" height="120" fill="#0ea5e9" rx="2"/>
      <!-- C11 inverted hammer -->
      <line x1="358" y1="300" x2="358" y2="130" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="351" y="260" width="14" height="30" fill="#0ea5e9" rx="1"/>
      <!-- C12 big bear reversal -->
      <line x1="392" y1="310" x2="392" y2="100" stroke="#6366f1" stroke-width="1.5"/>
      <rect x="382" y="120" width="20" height="150" fill="#6366f1" rx="2"/>
      <!-- C13 doji -->
      <line x1="424" y1="240" x2="424" y2="140" stroke="#c7e2f7" stroke-width="1"/>
      <rect x="418" y="188" width="12" height="4" fill="#c7e2f7" rx="1"/>
      <!-- C14 bear medium -->
      <line x1="456" y1="300" x2="456" y2="160" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="448" y="180" width="16" height="80" fill="#6366f1" rx="1"/>
      <!-- C15 small bull pullback -->
      <line x1="488" y1="320" x2="488" y2="230" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="481" y="250" width="14" height="40" fill="#0ea5e9" rx="1"/>
      <!-- C16 big bear continuation -->
      <line x1="522" y1="380" x2="522" y2="200" stroke="#6366f1" stroke-width="1.5"/>
      <rect x="512" y="220" width="20" height="130" fill="#6366f1" rx="2"/>
      <!-- C17 tiny bull -->
      <line x1="554" y1="420" x2="554" y2="370" stroke="#0ea5e9" stroke-width="1"/>
      <rect x="548" y="380" width="12" height="22" fill="#0ea5e9" rx="1"/>
      <!-- C18 hammer bottom -->
      <line x1="586" y1="500" x2="586" y2="310" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="578" y="320" width="16" height="30" fill="#0ea5e9" rx="1"/>
      <!-- C19 bear -->
      <line x1="618" y1="480" x2="618" y2="330" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="610" y="350" width="16" height="90" fill="#6366f1" rx="1"/>
      <!-- C20 spinning top -->
      <line x1="650" y1="500" x2="650" y2="370" stroke="#c7e2f7" stroke-width="1"/>
      <rect x="644" y="425" width="12" height="15" fill="#c7e2f7" rx="1"/>
      <!-- C21 bull engulfing -->
      <line x1="684" y1="510" x2="684" y2="340" stroke="#0ea5e9" stroke-width="1.5"/>
      <rect x="673" y="360" width="22" height="120" fill="#0ea5e9" rx="2"/>
      <!-- C22 small bear -->
      <line x1="716" y1="420" x2="716" y2="340" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="709" y="355" width="14" height="35" fill="#6366f1" rx="1"/>
      <!-- C23 doji -->
      <line x1="748" y1="430" x2="748" y2="350" stroke="#c7e2f7" stroke-width="1"/>
      <rect x="742" y="388" width="12" height="4" fill="#c7e2f7" rx="1"/>
      <!-- C24 bear medium -->
      <line x1="780" y1="480" x2="780" y2="360" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="772" y="380" width="16" height="65" fill="#6366f1" rx="1"/>
      <!-- C25 tall bear -->
      <line x1="814" y1="550" x2="814" y2="370" stroke="#6366f1" stroke-width="1.5"/>
      <rect x="804" y="390" width="20" height="130" fill="#6366f1" rx="2"/>
      <!-- C26 tiny bull -->
      <line x1="846" y1="570" x2="846" y2="500" stroke="#0ea5e9" stroke-width="1"/>
      <rect x="840" y="520" width="12" height="20" fill="#0ea5e9" rx="1"/>
      <!-- C27 small bull -->
      <line x1="876" y1="550" x2="876" y2="480" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="869" y="495" width="14" height="30" fill="#0ea5e9" rx="1"/>
      <!-- C28 long wick bear -->
      <line x1="908" y1="620" x2="908" y2="440" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="900" y="460" width="16" height="50" fill="#6366f1" rx="1"/>
      <!-- C29 marubozu bull -->
      <line x1="942" y1="600" x2="942" y2="580" stroke="#0ea5e9" stroke-width="1"/>
      <rect x="932" y="470" width="20" height="115" fill="#0ea5e9" rx="2"/>
      <!-- C30 bear -->
      <line x1="976" y1="530" x2="976" y2="410" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="968" y="430" width="16" height="70" fill="#6366f1" rx="1"/>
      <!-- C31 doji -->
      <line x1="1008" y1="560" x2="1008" y2="480" stroke="#c7e2f7" stroke-width="1"/>
      <rect x="1002" y="518" width="12" height="4" fill="#c7e2f7" rx="1"/>
      <!-- C32 big bull recovery -->
      <line x1="1042" y1="570" x2="1042" y2="380" stroke="#0ea5e9" stroke-width="1.5"/>
      <rect x="1032" y="400" width="20" height="140" fill="#0ea5e9" rx="2"/>
      <!-- C33 medium bull -->
      <line x1="1076" y1="460" x2="1076" y2="320" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="1068" y="350" width="16" height="75" fill="#0ea5e9" rx="1"/>
      <!-- C34 shooting star -->
      <line x1="1108" y1="400" x2="1108" y2="220" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="1101" y="360" width="14" height="28" fill="#6366f1" rx="1"/>
      <!-- C35 small bear -->
      <line x1="1140" y1="440" x2="1140" y2="350" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="1133" y="365" width="14" height="45" fill="#6366f1" rx="1"/>
      <!-- C36 bull -->
      <line x1="1174" y1="420" x2="1174" y2="280" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="1166" y="300" width="16" height="90" fill="#0ea5e9" rx="1"/>
      <!-- C37 tiny doji -->
      <line x1="1206" y1="350" x2="1206" y2="270" stroke="#c7e2f7" stroke-width="1"/>
      <rect x="1200" y="308" width="12" height="4" fill="#c7e2f7" rx="1"/>
      <!-- C38 medium bull -->
      <line x1="1238" y1="340" x2="1238" y2="200" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="1230" y="230" width="16" height="70" fill="#0ea5e9" rx="1"/>
      <!-- C39 small bear -->
      <line x1="1270" y1="290" x2="1270" y2="210" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="1263" y="225" width="14" height="40" fill="#6366f1" rx="1"/>
      <!-- C40 big bear -->
      <line x1="1304" y1="380" x2="1304" y2="170" stroke="#6366f1" stroke-width="1.5"/>
      <rect x="1294" y="190" width="20" height="150" fill="#6366f1" rx="2"/>
      <!-- C41 hammer -->
      <line x1="1338" y1="500" x2="1338" y2="310" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="1331" y="320" width="14" height="28" fill="#0ea5e9" rx="1"/>
      <!-- C42 bull medium -->
      <line x1="1372" y1="450" x2="1372" y2="300" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="1364" y="330" width="16" height="80" fill="#0ea5e9" rx="1"/>
      <!-- C43 bear small -->
      <line x1="1406" y1="400" x2="1406" y2="320" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="1399" y="340" width="14" height="35" fill="#6366f1" rx="1"/>
      <!-- C44 big bull -->
      <line x1="1442" y1="380" x2="1442" y2="190" stroke="#0ea5e9" stroke-width="1.5"/>
      <rect x="1432" y="210" width="20" height="140" fill="#0ea5e9" rx="2"/>
      <!-- C45 doji -->
      <line x1="1476" y1="320" x2="1476" y2="240" stroke="#c7e2f7" stroke-width="1"/>
      <rect x="1470" y="278" width="12" height="4" fill="#c7e2f7" rx="1"/>
      <!-- C46 bear -->
      <line x1="1510" y1="400" x2="1510" y2="260" stroke="#6366f1" stroke-width="1.2"/>
      <rect x="1502" y="280" width="16" height="85" fill="#6366f1" rx="1"/>
      <!-- C47 small bull -->
      <line x1="1544" y1="380" x2="1544" y2="300" stroke="#0ea5e9" stroke-width="1.2"/>
      <rect x="1537" y="320" width="14" height="35" fill="#0ea5e9" rx="1"/>
      <!-- C48 bear close -->
      <line x1="1576" y1="440" x2="1576" y2="310" stroke="#6366f1" stroke-width="1.5"/>
      <rect x="1566" y="330" width="20" height="80" fill="#6366f1" rx="2"/>
    </svg>
  `,
  styles: [`
    :host { display: contents; }
    .candle-bg {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none;
    }
  `],
})
export class CandleBgComponent {
  @Input() opacity = 0.12;
}
