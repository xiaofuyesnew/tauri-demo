import CompassImg from '@/assets/image/window node/compass.png';
import AxisImg from '@/assets/image/window node/axis.png';
import Axis1Img from '@/assets/image/window node/axis1.png';
import AutometicLegendImg from '@/assets/image/window node/autometic legend.png';
import PerformanceIndicatorImg from '@/assets/image/window node/performance indicator.png';
import LightImg from '@/assets/image/window node/light.png';
import ScaleBarImg from '@/assets/image/window node/scale bar.png';
import InterpretationWindowImg from '@/assets/image/window node/interpretation window.png'
import StickyCursorImg from '@/assets/image/window node/sticky cursor.png'
import FrameImg from '@/assets/image/window node/frame.png';
import HeaderImg from '@/assets/image/window node/header.png';
import InfoBoxImg from '@/assets/image/window node/info box.png';
import SymbolLegendImg from '@/assets/image/window node/symbol legend.png';
import FunctionImg from '@/assets/image/window node/function.png';
import InterpretationImg from '@/assets/image/window node/interpretation.png';
import seismicOverlayImg from '@/assets/image/window node/seismic overlay.png';
import MapImg from '@/assets/image/window node/map.png';
import NorthArrowImg from '@/assets/image/window node/north arrow.png';
import StereonetImg from '@/assets/image/window node/stereonet.png';


const generateRandomId = (len = 5) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let randomStr = '';

    for (let i = 0; i < len; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        randomStr += chars[randomIndex];
    }
    const timestamp = Date.now().toString();
    return `${randomStr}_${timestamp}`;
}

export const getNodeImage = (nodeType) => {
    let img = null;
    switch (nodeType) {
        case 'Compass':
            img = CompassImg;
            break;
        case 'Axis':
            img = AxisImg;
            break;
        case 'Axis1':
            img = Axis1Img;
            break;
        case 'Autometic legend':
            img = AutometicLegendImg;
            break;
        case 'Performance indicator':
            img = PerformanceIndicatorImg;
            break;
        case 'Light sources':
        case 'Headlight':
            // img = LightImg;
            break;
        case 'Scale bar':
            img = ScaleBarImg;
            break;
        case 'Interpretation window':
            img = InterpretationWindowImg;
            break;
        case 'Sticky cursor':
            img = StickyCursorImg;
            break;
        case 'Frame':
            img = FrameImg;
            break;
        case 'Header':
            img = HeaderImg;
            break;
        case 'Info box':
            img = InfoBoxImg;
            break;
        case 'Symbol legend':
            img = SymbolLegendImg;
            break;
        case 'Function':
            img = FunctionImg;
            break;
        case 'Interpretation':
            img = InterpretationImg;
            break;
        case 'Seismic overlay':
            img = seismicOverlayImg;
            break;
        case 'Map':
            img = MapImg;
            break;
        case 'North arrow':
            img = NorthArrowImg;
            break;
        case 'Stereonet':
            img = StereonetImg;
            break;
        default:
            break;
    }
    return img;
}

let config = {
    '2D window': [
        {
            title: 'Compass',
            type: 'Compass',
            img: 'Compass',
            checked: true
        },
        {
            title: 'Axis',
            type: 'Axis',
            img: 'Axis',
            checked: false
        },
        {
            title: 'Autometic legend',
            type: 'Autometic legend',
            img: 'Autometic legend',
            checked: false
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        },
        {
            title: 'Light sources',
            type: 'Light sources',
            img: 'Light sources',
            checked: true,
            children: [
                {
                    title: 'Headlight',
                    type: 'Headlight',
                    img: 'Headlight',
                    checked: true
                }
            ]
        },
        {
            title: 'Scale bar',
            type: 'Scale bar',
            img: 'Scale bar',
            checked: true
        },
        {
            title: 'Interpretation window',
            type: 'Interpretation window',
            img: 'Interpretation window',
            checked: true
        }
    ],
    '3D window': [
        {
            title: 'Compass',
            type: 'Compass',
            img: 'Compass',
            checked: true
        },
        {
            title: 'Axis',
            type: 'Axis',
            img: 'Axis',
            checked: false
        },
        {
            title: 'Autometic legend',
            type: 'Autometic legend',
            img: 'Autometic legend',
            checked: false
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        },
        {
            title: 'Light sources',
            type: 'Light sources',
            img: 'Light sources',
            checked: true,
            children: [
                {
                    title: 'Headlight',
                    type: 'Headlight',
                    img: 'Headlight',
                    checked: true
                }
            ]
        },
        {
            title: 'Artificial horizon',
            type: 'Artificial horizon',
            img: 'Artificial horizon',
            checked: false
        },
        {
            title: 'Sticky cursor',
            type: 'Sticky cursor',
            img: 'Sticky cursor',
            checked: false
        },
        {
            title: 'Interpretation window',
            type: 'Interpretation window',
            img: 'Interpretation window',
            checked: true
        }
    ],
    'Function window': [
        {
            title: 'Function 1',
            type: 'Function 1',
            img: 'Function',
            checked: true,
            children: [
                {
                    title: 'Axis',
                    type: 'Axis',
                    img: 'Axis1',
                    checked: true
                },
                {
                    title: 'Header',
                    type: 'Header',
                    img: 'Header',
                    checked: false
                },
                {
                    title: 'Info box',
                    type: 'Info box',
                    img: 'Info box',
                    checked: false
                },
                {
                    title: 'Autometic legend',
                    type: 'Autometic legend',
                    img: 'Autometic legend',
                    checked: false
                },
                {
                    title: 'Symbol legend',
                    type: 'Symbol legend',
                    img: 'Symbol legend',
                    checked: true
                }
            ]
        },
        {
            title: 'Frame',
            type: 'Frame',
            img: 'Frame',
            checked: false
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        }
    ],
    'Histogram window': [
        {
            title: 'Histogram 1',
            type: 'Histogram',
            checked: true,
            children: [
                {
                    title: 'Axis',
                    type: 'Axis',
                    img: 'Axis1',
                    checked: true
                },
                {
                    title: 'Header',
                    type: 'Header',
                    img: 'Header',
                    checked: false
                },
                {
                    title: 'Info box',
                    type: 'Info box',
                    img: 'Info box',
                    checked: false
                },
                {
                    title: 'Symbol legend',
                    type: 'Symbol legend',
                    img: 'Symbol legend',
                    checked: true
                }
            ]
        },
        {
            title: 'Frame',
            type: 'Frame',
            img: 'Frame',
            checked: false
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        }
    ],
    "Interpretation window": [
        {
            title: 'Interpretation 1',
            type: 'Interpretation',
            img: 'Interpretation',
            checked: true,
            children: [
                {
                    title: 'Autometic legend',
                    type: 'Autometic legend',
                    img: 'Autometic legend',
                    checked: false
                },
                {
                    title: 'Grid lines',
                    type: 'Grid lines',
                    img: 'Axis1',
                    checked: false
                },
                {
                    title: 'Info box',
                    type: 'Info box',
                    img: 'Info box',
                    checked: false
                },
                {
                    title: 'Header',
                    type: 'Header',
                    img: 'Header',
                    checked: false
                },
                {
                    title: 'Scale bar',
                    type: 'Scale bar',
                    img: 'Scale bar',
                    checked: false
                },
                {
                    title: 'Seismic overlay',
                    type: 'Seismic overlay',
                    img: 'Seismic overlay',
                    checked: false
                }
            ]
        }
    ],
    'Intersection window': [
        {
            title: 'Intersection 1',
            type: 'Intersection',
            checked: true,
            children: [
                {
                    title: 'Axis',
                    type: 'Axis',
                    img: 'Axis1',
                    checked: true
                },
                {
                    title: 'Header',
                    type: 'Header',
                    img: 'Header',
                    checked: false
                },
                {
                    title: 'Info box',
                    type: 'Info box',
                    img: 'Info box',
                    checked: false
                },
                {
                    title: 'Scale bar',
                    type: 'Scale bar',
                    img: 'Scale bar',
                    checked: false
                },
                {
                    title: 'Autometic legend',
                    type: 'Autometic legend',
                    img: 'Autometic legend',
                    checked: false
                },
                {
                    title: 'Symbol legend',
                    type: 'Symbol legend',
                    img: 'Symbol legend',
                    checked: false
                }
            ]
        },
        {
            title: 'Frame',
            type: 'Frame',
            img: 'Frame',
            checked: false
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        }
    ],
    'Map window': [
        {
            title: 'Map 1',
            type: 'Map',
            img: 'Map',
            children: [
                {
                    title: 'Axis',
                    type: 'Axis',
                    img: 'Axis1',
                    checked: true
                },
                {
                    title: 'Header',
                    type: 'Header',
                    img: 'Header',
                    checked: false
                },
                {
                    title: 'Info box',
                    type: 'Info box',
                    img: 'Info box',
                    checked: true
                },
                {
                    title: 'Scale bar',
                    type: 'Scale bar',
                    img: 'Scale bar',
                    checked: true
                },
                {
                    title: 'North arrow',
                    type: 'North arrow',
                    img: 'North arrow',
                    checked: false
                },
                {
                    title: 'Autometic legend',
                    type: 'Autometic legend',
                    img: 'Autometic legend',
                    checked: true
                },
                {
                    title: 'Symbol legend',
                    type: 'Symbol legend',
                    img: 'Symbol legend',
                    checked: false
                }
            ]
        },
        {
            title: 'Frame',
            type: 'Frame',
            img: 'Frame',
            checked: true
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        }
    ],
    'Plot window': [
        {
            title: 'Frame',
            type: 'Frame',
            img: 'Frame',
            checked: true
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        }
    ],
    'Stereonet window': [
        {
            title: 'Stereonet 1',
            type: 'Stereonet',
            img: 'Stereonet',
            checked: true,
            children: [
                {
                    title: 'Header',
                    type: 'Header',
                    img: 'Header',
                    checked: false
                },
                {
                    title: 'Autometic legend',
                    type: 'Autometic legend',
                    img: 'Autometic legend',
                    checked: false
                },
                {
                    title: 'Stereonet grid',
                    type: 'Stereonet grid',
                    checked: true
                }
            ]
        },
        {
            title: 'Frame',
            type: 'Frame',
            img: 'Frame',
            checked: false
        },
        {
            title: 'Performance indicator',
            type: 'Performance indicator',
            img: 'Performance indicator',
            checked: false
        }
    ]
}

let confArr = Object.values(config);
confArr.forEach(conf => {
    generateId(conf);
})

function generateId(arr) {
    arr.forEach(item => {
        if (!item.id) {
            item.id = generateRandomId();
        }
        if (item.children) {
            generateId(item.children);
        }
    })
}

export { config };