// pane组件
import Archive from '@/components/pane/Archive.vue';
import Cases from '@/components/pane/Cases.vue';
import Favorites from '@/components/pane/Favorites.vue';
import Input from '@/components/pane/Input.vue';
import Layouts from '@/components/pane/Layouts.vue';
import MessageLog from '@/components/pane/MessageLog.vue';
import Models from '@/components/pane/Models.vue';
import Processes from '@/components/pane/Processes.vue';
import Project from '@/components/pane/Project.vue';
import Results from '@/components/pane/Results.vue';
import SearchFilter from '@/components/pane/SearchFilter.vue';
import SearchResults from '@/components/pane/SearchResults.vue';
import Tasks from '@/components/pane/Tasks.vue';
import Templates from '@/components/pane/Templates.vue';
import Windows from '@/components/pane/Windows.vue';
import Workflows from '@/components/pane/Workflows.vue';
// pane图标
import ArchiveImg from '@/assets/image/archive.png';
import CasesImg from '@/assets/image/cases.png';
import FavoritesImg from '@/assets/image/favorites.png';
import InputImg from '@/assets/image/input.png';
import LayoutsImg from '@/assets/image/layouts.png';
import MessageLogImg from '@/assets/image/message_log.png';
import ModelsImg from '@/assets/image/models.png';
import ProcessesImg from '@/assets/image/processes.png';
import ProjectImg from '@/assets/image/projects.png';
import ResultsImg from '@/assets/image/results.png';
import SearchFilterImg from '@/assets/image/search_filter.png';
import SearchResultsImg from '@/assets/image/search_results.png';
import TasksImg from '@/assets/image/tasks.png';
import TemplatesImg from '@/assets/image/templates.png';
import WindowsImg from '@/assets/image/windows.png';
import WorkflowsImg from '@/assets/image/workflows.png';
// window组件
import TwoD from '@/components/window/2D.vue';
import ThreeD from '@/components/window/3DMix.vue';
import Charting from '@/components/window/Charting.vue';
import CurtainSection from '@/components/window/CurtainSection.vue';
import Function from '@/components/window/Function.vue';
import Geosteering from '@/components/window/Geosteering.vue';
import Geotime from '@/components/window/Geotime.vue';
import Histogram from '@/components/window/Histogram.vue';
import Interpretation from '@/components/window/Interpretation.vue';
import Intersection from '@/components/window/Intersection.vue';
import Map from '@/components/window/Map.vue';
import PdfViewer from '@/components/window/PdfViewer.vue';
import PetrosysMap from '@/components/window/PetrosysMap.vue';
import Plot from '@/components/window/Plot.vue';
import QiCrossplot from '@/components/window/QiCrossplot.vue';
import Stereonet from '@/components/window/Stereonet.vue';
import StratigraphicChart from '@/components/window/StratigraphicChart.vue';
import TectonicStress from '@/components/window/TectonicStress.vue';
import TimePlotAnalysis from '@/components/window/TimePlotAnalysis.vue';
import TornadoPlot from '@/components/window/TornadoPlot.vue';
import WellSection from '@/components/window/WellSection.vue';
// window图标
import TwoDImg from '@/assets/image/2d window.png';
import ThreeDImg from '@/assets/image/3d window.png';
import ChartingImg from '@/assets/image/charting window.png';
import CurtainSectionImg from '@/assets/image/curtain section window.png';
import FunctionImg from '@/assets/image/function window.png';
import GeosteeringImg from '@/assets/image/geosteering window.png';
import GeotimeImg from '@/assets/image/geotime window.png';
import HistogramImg from '@/assets/image/histogram window.png';
import InterpretationImg from '@/assets/image/interpretation window.png';
import IntersectionImg from '@/assets/image/intersection window.png';
import MapImg from '@/assets/image/map window.png';
import PdfViewerImg from '@/assets/image/pdf viewer.png';
import PetrosysMapImg from '@/assets/image/petrosys map window.png';
import QiCrossplotImg from '@/assets/image/qi crossplot window.png';
import PlotImg from '@/assets/image/plot window.png';
import StereonetImg from '@/assets/image/stereonet window.png';
import StratigraphicChartImg from '@/assets/image/stratigraphic chart window.png';
import TectonicStressImg from '@/assets/image/tectonic stress window.png';
import TimePlotAnalysisImg from '@/assets/image/time plot analysis window.png';
import TornadoPlotImg from '@/assets/image/tornado plot window.png';
import WellSectionImg from '@/assets/image/well section window.png';

export const paneList = [
    {
        name: '面板1',
        img: ArchiveImg,
        comp: Archive
    },
    {
        name: '面板2',
        img: CasesImg,
        comp: Cases
    },
    {
        name: '面板3',
        img: FavoritesImg,
        comp: Favorites
    },
    {
        name: '面板4',
        img: InputImg,
        comp: Input
    },
    {
        name: '面板5',
        img: LayoutsImg,
        comp: Layouts
    },
    {
        name: '面板6',
        img: MessageLogImg,
        comp: MessageLog
    },
    {
        name: '面板7',
        img: ModelsImg,
        comp: Models
    },
    {
        name: '面板8',
        img: ProcessesImg,
        comp: Processes
    },
    {
        name: '面板9',
        img: ProjectImg,
        comp: Project
    },
    {
        name: 'Results',
        img: ResultsImg,
        comp: Results
    },
    {
        name: 'Search filter',
        img: SearchFilterImg,
        comp: SearchFilter
    },
    {
        name: 'Search results',
        img: SearchResultsImg,
        comp: SearchResults
    },
    {
        name: 'Tasks',
        img: TasksImg,
        comp: Tasks
    },
    {
        name: 'Templates',
        img: TemplatesImg,
        comp: Templates
    },
    {
        name: 'Windows',
        img: WindowsImg,
        comp: Windows
    },
    {
        name: 'Workflows',
        img: WorkflowsImg,
        comp: Workflows
    }
]

export const windowList = [
    {
        name: '文档1',
        img: TwoDImg,
        comp: TwoD
    },
    {
        name: '文档2',
        img: ThreeDImg,
        comp: ThreeD
    },
    {
        name: '文档3',
        img: ChartingImg,
        comp: Charting
    },
    {
        name: '文档4',
        img: CurtainSectionImg,
        comp: CurtainSection
    },
    {
        name: '文档5',
        img: FunctionImg,
        comp: Function
    },
    {
        name: '文档6',
        img: GeosteeringImg,
        comp: Geosteering
    },
    {
        name: '文档7',
        img: GeotimeImg,
        comp: Geotime
    },
    {
        name: '文档8',
        img: HistogramImg,
        comp: Histogram
    },
    {
        name: '文档9',
        img: InterpretationImg,
        comp: Interpretation
    },
    {
        name: '文档10',
        img: IntersectionImg,
        comp: Intersection
    },
    {
        name: '文档11',
        img: MapImg,
        comp: Map
    },
    {
        name: '文档12',
        img: PdfViewerImg,
        comp: PdfViewer
    },
    {
        name: '文档13',
        img: PetrosysMapImg,
        comp: PetrosysMap
    },
    {
        name: '文档14',
        img: PlotImg,
        comp: Plot
    },
    {
        name: '文档15',
        img: QiCrossplotImg,
        comp: QiCrossplot
    },
    {
        name: '文档16',
        img: StereonetImg,
        comp: Stereonet
    },
    {
        name: '文档17',
        img: StratigraphicChartImg,
        comp: StratigraphicChart
    },
    {
        name: '文档18',
        img: TectonicStressImg,
        comp: TectonicStress
    },
    {
        name: '文档19',
        img: TimePlotAnalysisImg,
        comp: TimePlotAnalysis
    },
    {
        name: '文档20',
        img: TornadoPlotImg,
        comp: TornadoPlot
    },
    {
        name: '文档21',
        img: WellSectionImg,
        comp: WellSection
    }
]

export const layoutBeforeSelectProject = {
    direction: 'column',
    size: '100%',
    children: [
        {
            direction: 'column',
            type: 'pane',
            data: {
                active: '面板1',
                group: ['面板1']
            }
        },
        {
            id: 'window',
            direction: 'column',
            type: 'window'
        }
    ],
    floatPane: [],
    autoHidePane: [],
}


export const layoutAfterSelectProject = {
    direction: 'column',
    size: '100%',
    children: [
        {
            direction: 'column',
            children: [
                {
                    direction: 'row',
                    size: '50%',
                    type: 'pane',
                    data: {
                        active: '面板1',
                        group: ['面板1', '面板2', '面板3']
                    }
                },
                {
                    direction: 'row',
                    size: '50%',
                    type: 'pane',
                    data: {
                        active: '面板4',
                        group: ['面板4']
                    }
                }
            ]
        },
        {
                direction: 'column',
                type: 'window'
        }
    ],
    floatPane: [],
    autoHidePane: [
        {
            group: [
                {
                    comp: '面板5'
                },
                {
                    comp: '面板6'
                }
            ]
        },
        {
            group: [
                {
                    comp: '面板7'
                }
            ]
        }
    ],
}

export const windowLayout = {
    "direction": "row",
    "size": "100%",
    "children": [
        {
            "active": 1,
            "direction": "column",
            "size": "50%",
            "tab": [
                {
                    "type": "文档3",
                    "title": "文档3",
                },
                {
                    "type": "文档5",
                    "title": "文档5",
                }
            ]
        },
        {
            "active": 0,
            "direction": "column",
            "size": "50%",
            "children": [
                {
                    "active": 0,
                    "direction": "row",
                    "size": "50%",
                    "tab": [
                        {
                            "type": "文档1",
                            "title": "文档1",
                        }
                    ]
                },
                {
                    "active": 0,
                    "direction": "row",
                    "size": "50%",
                    "tab": [
                        {
                            "type": "文档2",
                            "title": "文档2",
                        }
                    ]
                }
            ]
        }
    ]
}


export const getCompImage = (name) => {
    let compImage = null;
    switch (name) {
        case 'Archive':
            compImage = ArchiveImg;
            break;
        case 'Cases':
            compImage = CasesImg;
            break;
        case 'Favorites':
            compImage = FavoritesImg;
            break;
        case 'Input':
            compImage = InputImg;
            break;
        case 'Layouts':
            compImage = LayoutsImg;
            break;
        case 'Message log':
            compImage = MessageLogImg;
            break;
        case 'Models':
            compImage = ModelsImg;
            break;
        case 'Processes':
            compImage = ProcessesImg;
            break;
        case 'Projects':
            compImage = ProjectImg;
            break;
        case 'Results':
            compImage = ResultsImg;
            break;
        case 'Search filter':
            compImage = SearchFilterImg;
            break;
        case 'Search results':
            compImage = SearchResultsImg;
            break;
        case 'Tasks':
            compImage = TasksImg;
            break;
        case 'Templates':
            compImage = TemplatesImg;
            break;
        case 'Windows':
            compImage = WindowsImg;
            break;
        case 'Workflows':
            compImage = WorkflowsImg;
            break;
        
        case '2D window':
            compImage = TwoDImg;
            break;
        case '3D window':
            compImage = ThreeDImg;
            break;
        case 'Charting window':
            compImage = ChartingImg;
            break;
        case 'Curtain Section Window':
            compImage = CurtainSectionImg;
            break;
        case 'Function window':
            compImage = FunctionImg;
            break;
        case 'Geosteering window':
            compImage = GeosteeringImg;
            break;  
        case 'Geotime window':
            compImage = GeotimeImg;
            break;
        case 'Histogram window':
            compImage = HistogramImg;
            break;
        case 'Interpretation window':
            compImage = InterpretationImg;
            break;
        case 'Intersection window':
            compImage = IntersectionImg;
            break;
        case 'Map window':
            compImage = MapImg;
            break;
        case 'PDF viewer':
            compImage = PdfViewerImg;
            break;
        case 'Petrosys map window':
            compImage = PetrosysMapImg;
            break;
        case 'Plot window':
            compImage = PlotImg;
            break;
        case 'QI crossplot window':
            compImage = QiCrossplotImg;
            break;
        case 'Stereonet window':
            compImage = StereonetImg;
            break;
        case 'Stratigraphic chart window':
            compImage = StratigraphicChartImg;
            break;
        case 'Tectonic stress window':
            compImage = TectonicStressImg;
            break;
        case 'Time plot analysis window':
            compImage = TimePlotAnalysisImg;
            break;
        case 'Tornado plot window':
            compImage = TornadoPlotImg;
            break;
        case 'Well section window':
            compImage = WellSectionImg;
            break;
        default:
            compImage = null;
            break;
    }
    return compImage;
};

export const getComp = (name) => {
    let comp = null;
    switch (name) {
        case 'Archive':
            comp = Archive;
            break;
        case 'Cases':
            comp = Cases;
            break;
        case 'Favorites':
            comp = Favorites;
            break;
        case 'Input':
            comp = Input;
            break;
        case 'Layouts':
            comp = Layouts;
            break;
        case 'Message log':
            comp = MessageLog;
            break;
        case 'Models':
            comp = Models;
            break;
        case 'Processes':
            comp = Processes;
            break;
        case 'Projects':
            comp = Project;
            break;
        case 'Results':
            comp = Results;
            break;
        case 'Search filter':
            comp = SearchFilter;
            break;
        case 'Search results':
            comp = SearchResults;
            break;
        case 'Tasks':
            comp = Tasks;
            break;
        case 'Templates':
            comp = Templates;
            break;
        case 'Windows':
            comp = Windows;
            break;
        case 'Workflows':
            comp = Workflows;
            break;

        case '2D window':
            comp = TwoD;
            break;
        case '3D window':
            comp = ThreeD;
            break;
        case 'Charting window':
            comp = Charting;
            break;
        case 'Curtain Section Window':
            comp = CurtainSection;
            break;
        case 'Function window':
            comp = Function;
            break;
        case 'Geosteering window':
            comp = Geosteering;
            break;  
        case 'Geotime window':
            comp = Geotime;
            break;
        case 'Histogram window':
            comp = Histogram;
            break;
        case 'Interpretation window':
            comp = Interpretation;
            break;
        case 'Intersection window':
            comp = Intersection;
            break;
        case 'Map window':
            comp = Map;
            break;
        case 'PDF viewer':
            comp = PdfViewer;
            break;
        case 'Petrosys map window':
            comp = PetrosysMap;
            break;
        case 'Plot window':
            comp = Plot;
            break;
        case 'QI crossplot window':
            comp = QiCrossplot;
            break;
        case 'Stereonet window':
            comp = Stereonet;
            break;
        case 'Stratigraphic chart window':
            comp = StratigraphicChart;
            break;
        case 'Tectonics tress window':
            comp = TectonicStress;
            break;
        case 'Time plot analysis window':
            comp = TimePlotAnalysis;
            break;
        case 'Tornado plot window':
            comp = TornadoPlot;
            break;
        case 'Well section window':
            comp = WellSection;
            break;
        default:
            comp = null;
            break;
    }
    return comp;
}