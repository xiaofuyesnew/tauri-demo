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

import { reactive, ref } from 'vue';
const paneList = new window.Map();
const windowList = new window.Map();

/**
 * 批量注册pane
 * @param {*} list 需要注册的pane, [{name, img, comp}]
 * @returns 注册后的所有pane
 */
export const registerPaneList = (list) => {
    list.forEach(p => {
        if (p.name) {
            paneList.set(p.name, {
                img: p.img,
                comp: p.comp
            });
        }
    })
    
    return paneList;
}

/**
 * 批量注册window
 * @param {*} list 需要注册的pane, [{name, img, comp}]
 * @returns 注册后的所有window
 */
export const registerWindowList = (list) => {
    list.forEach(w => {
        if (w.name) {
            windowList.set(w.name, {
                img: w.img,
                comp: w.comp
            });
        }
    })
    
    return windowList;
}


export const getPaneImage = (name) => {
    if (!name) return null;
    const item = paneList.get(name);
    return item ? item.img : null;
};

export const getWindowImage = (name) => {
    if (!name) return null;
    const item = windowList.get(name);
    return item ? item.img : null;
}

export const getPaneComp = (name) => {
    if (!name) return null;
    const item = paneList.get(name);
    return item ? item.comp : null;
}

export const getWindowComp = (name) => {
    if (!name) return null;
    const item = windowList.get(name);
    return item ? item.comp : null;
}
