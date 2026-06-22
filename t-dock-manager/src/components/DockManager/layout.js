import { reactive, ref, onMounted, nextTick, watch, toRef, onBeforeUnmount, computed } from 'vue';
import emitter from './eventBus';

let mainHeight = ref(0);
let mainWidth = ref(0);

let clearMenu = ref(false);

const floatPaneIdPrefix = ref('floatRoot_');

const indicatorHover = ref(false);

const indicatorInFloat = reactive(new Set());

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

const defaultProjectId = ref(generateRandomId());

/**
 * 行与列之间的间距
 */
const spliterGap = ref(1);

/**
 * pane默认宽度
 */
const defaultWidth = ref(250);
const defaultWidthPercent = ref('');

/**
 * 拖拽后的默认高度
 */
const defaultHeight = ref('15%');

/**
 * 当前拖拽的pane的id（对于多pane的floatpane，记录的是floatPane的rootId）
 */
const curDragId = ref('');

/**
 * 当前激活的pane的id
 */
const curActive = ref('');

/**
 * 浮动窗口的基准zIndex，按照浮动窗口在floatPane中的索引，从高到低递减
 */
const floatBaseZIndex = 50;


/**
 * 选择项目前的默认布局数据
 */
let layoutDataBeforeSelectProject = reactive({
    id: 'root',
    type: 'root',
    direction: 'column',
    size: '100%',
    children: [
        {
            id: defaultProjectId,
            direction: 'column',
            type: 'pane',
            data: {
                active: 'Projects',
                group: ['Projects']
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
});

/**
 * 选择项目后的默认布局数据
 */
let layoutData = ref(null);
// let layoutData = ref({
//     id: 'root',
//     type: 'root',
//     direction: 'column',
//     size: '100%',
//     children: [
//         {
//             id: generateRandomId(),
//             direction: 'column',
//             children: [
//                 {
//                     id: generateRandomId(),
//                     direction: 'row',
//                     size: '50%',
//                     type: 'pane',
//                     data: {
//                         active: 'Input',
//                         group: ['Input', 'Cases', 'Templates']
//                     }
//                 },
//                 {
//                     id: generateRandomId(),
//                     direction: 'row',
//                     size: '50%',
//                     type: 'pane',
//                     data: {
//                         active: 'Models',
//                         group: ['Models', 'Results', 'Workflows']
//                     }
//                 }
//             ]
//         },
//         {
//                 id: 'window',
//                 direction: 'column',
//                 type: 'window'
//         }
//     ],
//     floatPane: [],
//     autoHidePane: [
//         {
//             id: generateRandomId(),
//             group: [
//                 {
//                     id: generateRandomId(),
//                     comp: 'Favorites'
//                 },
//                 {
//                     id: generateRandomId(),
//                     comp: 'Layouts'
//                 },
//                 {
//                     id: generateRandomId(),
//                     comp: 'Windows'
//                 }
//             ]
//         },
//         {
//             id: generateRandomId(),
//             group: [
//                 {
//                     id: generateRandomId(),
//                     comp: 'Message log'
//                 },
//                 {
//                     id: generateRandomId(),
//                     comp: 'Tasks'
//                 }
//             ]
//         }
//     ],
// });

/**
 * 当前布局数据
 */
let curLayoutData = ref({
    id: 'root',
    direction: 'column',
    size: '100%',
    children: [
        {
            id: 'window',
            direction: 'column',
            type: 'window'
        }
    ],
    floatPane: [],
    autoHidePane: [],
});

let windowLayout = ref({
    maximize: '',
    active: '',
    data: null
})

const windowTabList = computed(() => {
    let result = [];
    function findTab(node) {
        if (!node) return;
        if (node.tab) {
            result.push(...node.tab);
        } else if (node.children) {
            node.children.forEach(item => {
                findTab(item);
            })
        }
    }

    findTab(windowLayout.value.data);

    return result;
})

const paneTabList = computed(() => {
    let result = [];
    function findTab(nodeArr) {
        if (!nodeArr) return;
        nodeArr.forEach(node => {
            if (node && node.type == 'pane') {
                result.push(...node.data.group.map(i => {
                    return {
                        id: node.id,
                        comp: i
                    }
                }));
            }
            if (node.children) {
                findTab(node.children);
            }
        })
    }

    findTab(curLayoutData.value.children);
    findTab(curLayoutData.value.floatPane);

    if (curLayoutData.value.autoHidePane) {
        curLayoutData.value.autoHidePane.forEach(item => {
            result.push(...item.group.map(i => {return { id: i.id, comp: i.comp}}));
        })
    }

    return result;
})


const windowRootId = ref('window-root');

const dragWindowTab = ref(null);

/**
 * 当前展示的autoHide窗口
 */
const curAutoHideActive = ref('');

export function useLayout() {
    const setIndicatorHover = (flag) => {
        indicatorHover.value = flag;
    }

    /**
     * 打开指定名称的窗口
     * @param {*} windowName 
     */
    const openWindowByName = (windowName) => {
        let id = generateRandomId();
        let title = '';
        if (!windowLayout.value.data) {
            title = windowName;
            windowLayout.value.data = {
                id: windowRootId.value,
                active: 0,
                direction: 'column',
                size: '100%',
                tab: [
                    {
                        type: windowName,
                        title,
                        id
                    }
                ]
            };
            windowLayout.value.active = id;
        } else {
            const activeWindow = getActiveWindow();
            if (!activeWindow) {
                return;
            }
            // const num = getWindowTypeNum(windowName);
            let num = 0;
            title = num ? `${windowName} ${num + 1}` : windowName;
            while (isTitleExist(title)) {
                num++;
                title = num ? `${windowName} ${num + 1}` : windowName;
            }
            activeWindow.tab.push({
                type: windowName,
                title,
                id
            });
        }

        emitter.emit('openNewWindow', {
            type: windowName,
            title,
            id
        })
    }

    /**
     * 获取window中active窗口
     */
    const getActiveWindow = () => {
        let result = windowLayout.value.data;
        function findWindow(node) {
            if (node && node.tab && node.tab.some(item => item.id == windowLayout.value.active)) {
                result = node;
            } else if (node && node.children && node.children.length) {
                node.children.forEach(child => {
                    findWindow(child);
                })
            }
        }
        findWindow(windowLayout.value.data);
        return result;
    }

    const getWindowByTabId = (id) => {
        if (!id) return;
        let result = null;
        function findWndow(node) {
            if (node && node.tab && node.tab.some(item => item.id == id)) {
                result = node;
            } else if (node && node.children && node.children.length) {
                node.children.forEach(child => {
                    findWndow(child);
                })
            }
        }
        findWndow(windowLayout.value.data);
        return result;
    }

    
    /**
     * 
     * @param {*} id 
     * @param {*} display 是否显示
     * @returns 
     */
    const toggleWindowDisplay = (data, display) => {
        if (display) {
            // 找到当前active
            let curActiveWindow = getActiveWindow();
            if (curActiveWindow) {
                curActiveWindow.tab.push({
                    type: data.type,
                    title: data.title,
                    id: data.id
                })
                curActiveWindow.active = curActiveWindow.tab.length - 1;
                windowLayout.value.active = data.id;
            } else {
                windowLayout.value.data = {
                    id: windowRootId.value,
                    active: 0,
                    direction: 'column',
                    size: '100%',
                    tab: [
                        {
                            type: data.type,
                            title: data.title,
                            id: data.id
                        }
                    ]
                }

                windowLayout.value.active = data.id;
            }
        } else {
            const window = getWindowByTabId(data.id);
            if (!window) return;
            let tab = window.tab.find(i => i.id == data.id);
            if (!tab) return;
            closeWindow(window.id, tab);
        }
    }

    /**
     * 获取指定id的window
     * @param {*} id 
     * @returns 
     */
    const getWindowById = (id) => {
        if (!id) {
            return;
        }
        let result = null;
        function findWindow(node) {
            if (node && node.id == id) {
                result = node;
            } else if (node && node.children && node.children.length) {
                node.children.forEach(child => {
                    findWindow(child);
                })
            }
        }
        findWindow(windowLayout.value.data);
        return result;
    }

    /**
     * 根据tab获取window
     * @param {*} tab 
     * @returns 
     */
    const getWindowByTab = (tab) => {
        if (!tab) return;
        let result = null;
        function findWindow(node) {
            if (node && node.tab && node.tab.some(item => item == tab)) {
                result = node;
            } else if (node && node.children && node.children.length) {
                node.children.forEach(child => {
                    findWindow(child);
                })
            }
        }
        findWindow(windowLayout.value.data);
        return result;
    }

    /**
     * 根据子节点id获取父节点window
     * @param {*} childId 
     * @returns 
     */
    const getParentWindowByChildId = (childId) => {
        let parent = null;
        const findParent = (node) => {
            if (node && node.children && node.children.length) {
                if (node.children.some(child => child.id == childId)) {
                    parent = node;
                } else {
                    node.children.forEach(child => {
                        findParent(child);
                    })
                }
            }

        }
        findParent(windowLayout.value.data);
        return parent;
    }

    /**
     * 获取指定类型的窗口数量(不包含copy)
     * @param {*} type 
     * @returns 
     */
    const getWindowTypeNum = (type) => {
        let num = 0;
        function findWindow(node) {
            if (node && node.tab) {
                node.tab.forEach(i => {
                    if (i.type == type && !i.copy) {
                        num++;
                    }
                })
            } else if (node && node.children && node.children.length) {
                node.children.forEach(child => {
                    findWindow(child);
                })
            }
        }
        findWindow(windowLayout.value.data);
        return num;
    }

    /**
     * 判断指定title是否存在
     * @param {*} title 
     */
    const isTitleExist = (title) => {
        let exist = false;
        function findTitle(node) {
            if (node && node.tab) {
                node.tab.forEach(i => {
                    if (i.title == title) {
                        exist = true;
                    }
                })
            } else if (node && node.children && node.children.length) {
                node.children.forEach(child => {
                    findTitle(child);
                })
            }
        }
        findTitle(windowLayout.value.data);
        return exist;
    }

    /**
     * 获取所有窗口的tab
     */
    const getAllWindowTab = () => {
        const allWindowTab = [];
        function findWindow(node) {
            if (!node) {
                return;
            }
            if (node.tab && node.tab.length) {
                allWindowTab.push(...node.tab);
            } else if (node.children && node.children.length) {
                node.children.forEach(child => {
                    findWindow(child);
                })
            }
        }
        findWindow(windowLayout.value.data);
        return allWindowTab;
    }

    /**
     * 获取所有带分组的window
     * @returns 
     */
    const getAllWindowWithGroup = () => {
        const allWindow = [];
        function findWindow(node) {
            if (!node) return;
            if (node.tab && node.tab.length) {
                allWindow.push(node);
            } else if (node.children && node.children.length) {
                node.children.forEach(child => {
                    findWindow(child);
                })
            }
        }
        findWindow(windowLayout.value.data);
        return allWindow;
    }

    /**
     * 设置window窗口布局
     * @param {*} layout 
     */
    const setWindowLayout = (layout, preserveGroups = false) => {
        switch (layout) {
            case 'grid':
                setWindowGrid(preserveGroups);
                break;
            case 'horizontal':
                setWindowHorizontal(preserveGroups);
                break;
            case 'vertical':
                setWindowVertical(preserveGroups);
                break;
            default:
                break;
        }
    }

    /**
     * window窗口网格布局
     */
    const setWindowGrid = (preserveGroups) => {
        // 根据window窗口的宽高，以及tab的数量，计算Grid布局的行列数，力求每个窗口的宽高比接近1
        const windowDom = document.getElementById('window');
        const windowRect = windowDom.getBoundingClientRect();
        const W = windowRect.width;
        const H = windowRect.height;
        let arr = [];
        if (preserveGroups) {
            arr = getAllWindowWithGroup();
        } else {
            arr = getAllWindowTab();
        }
        let K = arr.length;

        let gridRow = 0; // 行数
        let gridCol = 0; // 列数
        calculateOptimalGrid();

        if (gridRow <= 0 || gridCol <= 0) {
            return;
        }

        let result = [];
        let tabIndex = 0;
        const lastRowNum = K % gridCol; // 布局正好完整时为0，否则为最后一行的个数
        for (let i = 0; i < gridRow; i++) { // 行数据
            let row = {
                id: generateRandomId(),
                direction: 'row',
                size: `${100 / gridRow}%`,
                children: []
            };
            for (let j = 0; j < gridCol; j++) { // 列数据
                if (tabIndex < arr.length) {
                    let size = gridCol;
                    if (lastRowNum !== 0) { // 处理最后一行的size
                        if (tabIndex >= gridCol * (gridRow - 1)) {
                            size = lastRowNum;
                        }
                    }
                    row.children.push({
                        id: generateRandomId(),
                        direction: 'column',
                        size: `${100 / size}%`,
                        active: 0,
                        tab: preserveGroups ? arr[tabIndex].tab : [arr[tabIndex]]
                    })
                    tabIndex++;
                }
            }
            result.push(row);
        }
        windowLayout.value.data = {
            id: windowRootId.value,
            active: windowLayout.value.data.active,
            direction: 'column',
            size: '100%',
            children: result
        }
        

        // 因数对生成函数
        function getFactorPairs(k) {
            const pairs = [];
            const seen = new Set(); // 去重集合
            for (let m = 1; m <= Math.sqrt(k); m++) {
                if (k % m === 0) {
                    // 生成两个方向的因数对
                    const pair1 = { m, n: k/m };
                    const pair2 = { m: k/m, n: m };
                    
                    // 去重后添加
                    [pair1, pair2].forEach(pair => {
                        const key = `${pair.m},${pair.n}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            pairs.push(pair);
                        }
                    });
                }
            }
            return pairs;
        }

        function calculateOptimalGrid() {
            if (W <= 0 || H <= 0 || K <= 0) { return; };
            const ratioTarget = 1;
            const EXTREME_RATIO = 4.0;
            const EXACT_RATIO_THRESHOLD = 2; // 用户指定宽高比阈值
            let bestM = 2, bestN = Math.ceil(K / bestM);
            let bestDiff = Infinity;

            // 阶段0：检查m>1且n>1且m×n=K且宽高比<2的精确匹配
            const factors = getFactorPairs(K);
            const validExactMatches = factors.filter(pair => {
                if (pair.m <= 1 || pair.n <= 1) return false; // 排除单行/单列
                const ratio = (W * pair.n) / (H * pair.m);
                return ratio < EXACT_RATIO_THRESHOLD; // 宽高比<2
            });
            if (validExactMatches.length > 0) {
                // 选择宽高比最接近1的
                const sorted = validExactMatches.map(pair => {
                    const ratio = (W * pair.n)/(H * pair.m);
                    return { ...pair, diff: Math.abs(ratio - ratioTarget) };
                }).sort((a,b) => a.diff - b.diff);
                bestM = sorted[0].m;
                bestN = sorted[0].n;
                gridRow = bestN;
                gridCol = bestM;
                return;
            }

            // 阶段1：优先m>1且n>1的非精确匹配
            for (let m = 2; m <= Math.min(K, W); m++) {
                const n = Math.ceil(K / m);
                if (n < 2) continue;
                const ratio = (W * n)/(H * m);
                const diff = Math.abs(ratio - ratioTarget);
                const area = m * n;
                if (diff < bestDiff || (diff === bestDiff && area < bestM * bestN)) {
                    bestM = m;
                    bestN = n;
                    bestDiff = diff;
                }
            }

            // 阶段2：极端情况允许单行/单列
            const cellRatio = (W * bestN)/(H * bestM);
            if (cellRatio > EXTREME_RATIO || cellRatio < 1/EXTREME_RATIO) {
                const rowRatio = (W * 1)/(H * K);
                const colRatio = (W * K)/(H * 1);
                const rowDiff = Math.abs(rowRatio - ratioTarget);
                const colDiff = Math.abs(colRatio - ratioTarget);
                if (rowDiff < bestDiff || colDiff < bestDiff) {
                    bestM = rowDiff < colDiff ? K : 1;
                    bestN = rowDiff < colDiff ? 1 : K;
                }
            }

            gridRow = bestN;
            gridCol = bestM;
        }
    }

    /**
     * window窗口水平布局
     */
    const setWindowHorizontal = (preserveGroups) => {
        let arr = [];
        if (preserveGroups) {
            arr = getAllWindowWithGroup();
        } else {
            arr = getAllWindowTab();
        }
        
        windowLayout.value.data = {
            id: windowLayout.value.data.id,
            active: windowLayout.value.active,
            direction: 'column',
            size: '100%',
            children: arr.map(item => {
                return {
                    id: item.id,
                    active: preserveGroups ? item.active : 0,
                    tab: preserveGroups ? item.tab : [item],
                    direction: 'row',
                    size: `${100 / arr.length}%`
                }
            })
        }
    }

    /**
     * window窗口垂直布局
     */
    const setWindowVertical = (preserveGroups) => {
        let arr = [];
        if (preserveGroups) {
            arr = getAllWindowWithGroup();
        } else {
            arr = getAllWindowTab();
        }

        windowLayout.value.data = {
            id: windowLayout.value.data.id,
            active: windowLayout.value.active,
            direction: 'row',
            size: '100%',
            children: arr.map(item => {
                return {
                    id: item.id,
                    active: preserveGroups ? item.active : 0,
                    tab: preserveGroups ? item.tab : [item],
                    direction: 'column',
                    size: `${100 / arr.length}%`
                }
            })
        }
    }

    /**
     * 复制当前active的窗口
     */
    const copyWindow = () => {
        if (!windowLayout.value.active) {
            return;
        }
        let activeWindow = getActiveWindow();
        const tab = activeWindow.tab.find(item => item.id == windowLayout.value.active);
        let num = 0;
        let title = `Copy${num ? ` (${num + 1})` : ''} of ${tab.type}`;
        while (isTitleExist(title)) {
            num++;
            title = `Copy${num ? ` (${num + 1})` : ''} of ${tab.type}`;
        }
        const id = generateRandomId();
        activeWindow.tab.push({
            type: tab.type,
            title: title,
            id: id,
            copy: true
        })
        emitter.emit('openNewWindow', {
            type: tab.type,
            title,
            id,
            copy: true
        })
    }

    /**
     * 更新窗口大小，size为拖动的px
     * @param {*} id 
     * @param {*} size 
     * @returns 
     */
    const updateWindowSize = (id, size, direction) => {
        if (!id) {
            return;
        }
        const window = getWindowById(id);
        const dom = document.getElementById(id);
        const rect = dom.getBoundingClientRect();
        if (!window) {
            return;
        }
        const sizeNum = window.size.replace('%', '');
        if (direction == 'column') {
            window.size = sizeNum / rect.width * (rect.width + size) + '%';
        } else if (direction == 'row') {
            window.size = sizeNum / rect.height * (rect.height + size) + '%';
        }
    }

    /**
     * 关闭window窗口中的tab
     * @param {*} id 
     * @param {*} tab 
     * @returns 
     */
    const closeWindow = (id, tab) => {
        if (!id) {
            return;
        }
        let window = getWindowById(id);
        if (!window) {
            return;
        }
        if (window.active == window.tab.indexOf(tab) || window.active >= window.tab.length) {
            if (window.tab.length > 1) {
                window.active = 0;
            }
        }
        window.tab.splice(window.tab.indexOf(tab), 1);
        if (!window.tab.length) {
            if (id == windowRootId.value) {
                windowLayout.value.data = null;
                windowLayout.value.active = '';
                windowLayout.value.maximize = ''
            } else {
                window.active = 0;

                updateParent(id);
                function updateParent(id) {
                    if (!id) {
                        return;
                    }
                    let curWindow = getWindowById(id);
                    if (id == windowRootId.value) {
                        windowLayout.value.data = null;
                        windowLayout.value.active = '';
                        windowLayout.value.maximize = ''
                    } else {
                        const parent = getParentWindowByChildId(id);
                        if (!parent) return;
                        parent.children.forEach(item => { // window的宽度平均分给其他兄弟节点
                            if (item.id !== id && item.size) {
                                item.size = calcSize(item.size, 100 / curWindow.size.replace('%', ''));
                            }
                        })
                        parent.children.splice(parent.children.indexOf(curWindow), 1);

                        if (parent.children.length == 0) {
                            updateParent(parent.id);
                        }
                    }
                }
            }
        }

        if (windowLayout.value.active == tab.id) {
            if (window.tab.length) {
                windowLayout.value.active = window.tab[0].id;
            } else {
                const tabs = getAllWindowTab();
                if (tabs.length) {
                    windowLayout.value.active = tabs[0].id;
                }
            }
        }

        emitter.emit('closeWindow', tab.id);

    }

    const closeWindowByTabId = (tabId) => {
        if (!tabId) return;
        const getWindowByTab = (id) => {
            if (!id) return;
            let result = null;
            function findWndow(node) {
                if (node && node.tab && node.tab.some(item => item.id == id)) {
                    result = node;
                } else if (node && node.children && node.children.length) {
                    node.children.forEach(child => {
                        findWndow(child);
                    })
                }
            }
            findWndow(windowLayout.value.data);
            return result;
        }

        const w = getWindowByTab(tabId);
        if (!w) return;

        const tab = w.tab.find(i => i.id == tabId);
        if (!tab) return;

        closeWindow(w.id, tab);
    }

    /**
     * 关闭所有window
     */
    const closeAllWindow = () => {
        windowLayout.value.data = null;
        windowLayout.value.active = '';
        windowLayout.value.maximize = ''
    }

    /**
     * 关闭所有其他window
     * @param {*} id 
     */
    const closeAllOtherWindow = (tab) => {
        windowLayout.value.data = {
            id: windowRootId.value,
            active: 0,
            direction: 'column',
            size: '100%',
            tab: [tab]
        };
        windowLayout.value.active = tab.id;
        windowLayout.value.maximize = '';
    }

    /**
     * 获取相邻的下一个window窗口
     * @param {*} window 
     */
    const getAdjacentWindow = (window) => {
        // 先序收集window的叶子节点
        function collectLeafNodes(node, leaves = []) {
            // 检查是否为叶子节点
            const isLeaf = !!node.tab;
            
            if (isLeaf) {
                leaves.push(node);
                return leaves;
            }
            
            // 递归遍历所有子节点（先序遍历：根→左→右）
            for (const child of node.children) {
                collectLeafNodes(child, leaves);
            }
            
            return leaves;
        }

        const leafNodes = collectLeafNodes(windowLayout.value.data);
        
        // 查找目标ID在叶子节点列表中的索引
        const targetIndex = leafNodes.indexOf(window);
        if (targetIndex == -1) return null;

        const leafCount = leafNodes.length;
        // 环形模式：使用取模运算实现首尾相连
        let prevIndex = (targetIndex - 1 + leafCount) % leafCount;
        let nextIndex = (targetIndex + 1) % leafCount;

        if (leafCount <= 1) {
            return null;
        } else {
            return {
                next: nextIndex !== -1 ? leafNodes[nextIndex] : null,
                prev: prevIndex !== -1 ? leafNodes[prevIndex] : null,
            }
        }
    }

    /**
     * window中的tab移动到下一个window
     * @param {*} window 
     * @param {*} tab 
     */
    const tabMoveToNext = (window, tab) => {
        const adjacent = getAdjacentWindow(window);
        if (!adjacent || !adjacent.next) {
            return;
        }
        closeWindow(window.id, tab);

        adjacent.next.tab.push(tab);
    }

    /**
     * window中的tab移动到下一个window
     * @param {*} window 
     * @param {*} tab 
     */
    const tabMoveToPrevious = (window, tab) => {
        const adjacent = getAdjacentWindow(window);
        if (!adjacent || !adjacent.prev) {
            return;
        }
        closeWindow(window.id, tab);

        adjacent.prev.tab.push(tab);
    }

    /**
     * 新增一个水平的tab，兼容两种操作
     * direction不传时，表示右键菜单的New horizontal tab group
     * direction传top或者bottom时，表示windowTab的拖拽drop到顶部或者底部
     * @param {*} window 
     * @param {*} tab 
     * @param {*} direction 
     * @returns 
     */
    const newHorizontalTab = (window, tab, direction) => {
        if (!direction) {
            if (window.tab.length <= 1) return;
        }
        let parent = getParentWindowByChildId(window.id);
        let sizeNum = window.size.replace('%', '');
        let children = [];
        let index = 0;
        if (window.direction == 'row') {
            if (!direction) {
                closeWindow(window.id, tab);
            }

            window.size = sizeNum / 2 + '%';
            if (window.id == windowRootId.value) {
                window.id = generateRandomId();
                if (direction == 'top') {
                    children = [
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'row',
                            size: sizeNum / 2 + '%',
                            tab: [tab]
                        },
                        window
                    ]
                } else {
                    children = [
                        window,
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'row',
                            size: sizeNum / 2 + '%',
                            tab: [tab]
                        }
                    ]
                }

                windowLayout.value.data = {
                    id: windowRootId.value,
                    active: windowLayout.value.data.active,
                    direction: 'row',
                    size: '100%',
                    children: children
               }
            } else {
                if (direction == 'top') {
                    index = parent.children.indexOf(window);
                } else {
                    index = parent.children.indexOf(window) + 1;
                }
                parent.children.splice(index, 0, {
                    id: generateRandomId(),
                    active: 0,
                    direction: 'row',
                    size: sizeNum / 2 + '%',
                    tab: [tab]
                })
            }

        } else if (window.direction == 'column') {
            if (!direction) {
                closeWindow(window.id, tab);
            }

            window.size = '50%';
            window.direction = 'row';
            if (window.id == windowRootId.value) {
                window.id = generateRandomId();
                if (direction == 'top') {
                    children = [
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'row',
                            size: '50%',
                            tab: [tab]
                        },
                        window
                    ]
                } else {
                    children = [
                        window,
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'row',
                            size: '50%',
                            tab: [tab]
                        }
                    ]
                }

                windowLayout.value.data = {
                    id: windowRootId.value,
                    active: windowLayout.value.data.active,
                    direction: 'column',
                    size: '100%',
                    children: children
                } 
            } else {
                if (direction == 'top') {
                    children = [
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'row',
                            size: '50%',
                            tab: [tab]
                        },
                        window
                    ]
                } else {
                    children = [
                        window,
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'row',
                            size: '50%',
                            tab: [tab]
                        }
                    ]
                }
                parent.children.splice(parent.children.indexOf(window), 1, {
                    id: generateRandomId(),
                    active: 0,
                    direction: 'column',
                    size: sizeNum + '%',
                    children: children
                })
            }

        }
    }

    /**
     * 新增一个水平的tab，兼容两种操作
     * direction不传时，表示右键菜单的New vertical tab group
     * direction传left或者right时，表示windowTab的拖拽drop到左边或者右边
     * @param {*} window 
     * @param {*} tab 
     * @param {*} direction 
     * @returns 
     */
    const newVerticalTab = (window, tab, direction) => {
        if (!direction) {
            if (window.tab.length <= 1) return;
        }
        let parent = getParentWindowByChildId(window.id);
        let sizeNum = window.size.replace('%', '');
        let children = [];
        let index = 0;
        if (window.direction == 'row') {
            if (!direction) {
                closeWindow(window.id, tab);
            }
            
            window.size = '50%';
            window.direction = 'column';
            if (window.id == windowRootId.value) {
                window.id = generateRandomId();
                if (direction == 'left') {
                    children = [
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'column',
                            size: '50%',
                            tab: [tab]
                        },
                        window
                    ]
                } else {
                    children = [
                        window,
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'column',
                            size: '50%',
                            tab: [tab]
                        }
                    ]
                }

                windowLayout.value.data = {
                    id: windowRootId.value,
                    active: windowLayout.value.data.active,
                    direction: 'column',
                    size: '100%',
                    children: children
                }
            } else {
                if (direction == 'left') {
                    children = [
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'column',
                            size: '50%',
                            tab: [tab]
                        },
                        window
                    ]
                } else {
                    children = [
                        window,
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'column',
                            size: '50%',
                            tab: [tab]
                        }
                    ]
                }
                parent.children.splice(parent.children.indexOf(window), 1, {
                    id: generateRandomId(),
                    active: 0,
                    direction: 'row',
                    size: sizeNum + '%',
                    children: children
                })
            }

        } else if (window.direction == 'column') {
            if (!direction) {
                closeWindow(window.id, tab);
            }

            window.size = sizeNum / 2 + '%';
            if (window.id == windowRootId.value) {
                window.id = generateRandomId();
                if (direction == 'left') {
                    children = [
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'column',
                            size: sizeNum / 2 + '%',
                            tab: [tab]
                        },
                        window
                    ]
                } else {
                    children = [
                        window,
                        {
                            id: generateRandomId(),
                            active: 0,
                            direction: 'column',
                            size: sizeNum / 2 + '%',
                            tab: [tab]
                        }
                    ]
                }

                windowLayout.value.data = {
                    id: windowRootId.value,
                    active: windowLayout.value.data.active,
                    direction: 'row',
                    size: '100%',
                    children: children
                }
            } else {
                if (direction == 'left') {
                    index = parent.children.indexOf(window);
                } else {
                    index = parent.children.indexOf(window) + 1;
                }

                parent.children.splice(index, 0, {
                    id: generateRandomId(),
                    active: 0,
                    direction: 'column',
                    size: sizeNum / 2 + '%',
                    tab: [tab]
                })
            }
        }
    }

    /**
     * 将dragWindowTab掺入到window中
     * @param {*} window 
     * @param {*} direction 
     */
    const dropTab = (window, direction) => {
        const fromWindow = getWindowByTab(dragWindowTab.value);
        
        switch (direction) {
            case 'top':
                newHorizontalTab(window, dragWindowTab.value, 'top');
                break;
            case 'right':
                newVerticalTab(window, dragWindowTab.value, 'right');
                break;
            case 'bottom':
                newHorizontalTab(window, dragWindowTab.value, 'bottom');
                break;
            case 'left':
                newVerticalTab(window, dragWindowTab.value, 'left');
                break;
            case 'center':
                window.tab.push(dragWindowTab.value);
                break;
            default:
                break;
        }
        closeWindow(fromWindow.id, dragWindowTab.value);


        dragWindowTab.value = null;
    }

    /**
     * 根据pane id设置当前pane为active状态
     * @param {*} id pane的id
     */
    const setCurActive = (id) => {
        curActive.value = id;
        const floatRootId = getFloatRoot(id);
        if (floatRootId) {
            const floatIndex = curLayoutData.value?.floatPane.findIndex(item => item.id == floatRootId);
            if (floatIndex !== -1 && floatIndex !== 0) {
                curLayoutData.value?.floatPane.unshift(...curLayoutData.value?.floatPane.splice(floatIndex, 1));
            }
        }
    };

    /**
     * 根据浮动窗口的rootId设置窗口中的第一个pane为active状态
     * @param {*} id 浮动窗口的rootId
     */
    const setCurActiveByRootId = (id) => {
        const paneArr = getAllPaneInFloat(id);
        if (paneArr && paneArr.length) {
            setCurActive(paneArr[0].id);
        }
    }

    /**
     * 重新计算浮动窗口的层级
     */
    watch(() => curLayoutData.value?.floatPane, (newVal, oldVal) => {
        if (newVal && newVal.length) {
            newVal.forEach((item, index) => {
                item.style.zIndex = floatBaseZIndex - index;
            })
        }
    }, { immediate: true, deep: true })

    /**
     * 设置当前展示的autoHide窗口
     * @param {*} id 
     */
    const setCurAutoHideActive = (id) => {
        curAutoHideActive.value = id;
    }

    /**
     * 左侧autoHide窗口的关闭
     * @param {*} id 
     * @returns 
     */
    const closeAutoHidePane = (id) => {
        if (!id) {
            return;
        }
        // 找到所属的autoHidePane项
        const index = curLayoutData.value?.autoHidePane.findIndex(item => item.group.some(j => j.id == id));
        // 找到所属的group项
        const groupIndex = curLayoutData.value?.autoHidePane[index].group.findIndex(i => i.id == id);
        // 如果group只剩当前这一项，直接删除autoHidePane项
        if (curLayoutData.value?.autoHidePane[index].group.length == 1) {
            curLayoutData.value?.autoHidePane.splice(index, 1);
        } else {
            curLayoutData.value?.autoHidePane[index].group.splice(groupIndex, 1);
        }
    }

    /**
     * 根据paneName获取对应的autoHide面板
     * @param {*} paneName 
     */
    const getAutoHideByPaneName = (paneName) => {
        let autoHidePane = null;
        for (let i = 0; i < curLayoutData.value?.autoHidePane.length; i++) {
            const item = curLayoutData.value?.autoHidePane[i];
            const res = item.group.some(j => j.comp == paneName);
            if (item.group.some(j => j.comp == paneName)) {
                autoHidePane = item;
                break;
            }
        }
        return autoHidePane;
    }

    /**
     * 更新左侧autoHide窗口的大小
     * @param {*} id 
     * @param {*} size 
     */
    const updateAutoHideSize = (id, size) => {
        let autoHidePane = null;
        for (let i = 0; i < curLayoutData.value?.autoHidePane.length; i++) {
            const item = curLayoutData.value?.autoHidePane[i];
            const res = item.group.find(j => j.id == id);
            if (res) {
                autoHidePane = res;
                break;
            }
        }
        if (autoHidePane) {
            autoHidePane.autoHideSize = size;
        }
    }
    
    /**
     * 将列的defaulyWidth转换为父容器的百分比
     */
    const transferDefaultWidthToPercent = () => {
        function transfer(nodeArr) {
            if (!nodeArr || !nodeArr.length) {
                return;
            }
            const parent = getParentByChildId(nodeArr[0].id);
            const parentDom = document.getElementById(parent.id);
            const parentRect = parentDom.getBoundingClientRect();
            nodeArr.forEach(item => {
                if (item.direction == 'column' && !item.size) {
                    item.size = defaultWidth.value / parentRect.width * 100 + '%';
                }

                if (item.children) {
                    transfer(item.children);
                }
            })
        }

        transfer(curLayoutData.value?.children);
    }

    /**
     * 计算children元素的尺寸和位置
     * @param {*} nodeArr 
     */
    const calcChildrenPosition = (nodeArr) => {
        if (!nodeArr) return;
        nodeArr.forEach(item => {
            const position = item.position;

            let startX = position[0];
            let startY = position[1];

            if (item.children && item.children.length) {
                item.children.forEach(child => {
                    if (!child.size[0] || !child.size[1]) { // 初始渲染，没有大小，默认均分
                        if (item.type === 'column') {
                            child.size[1] = mainHeight.value / item.children.length;
                        } else if (item.type === 'row') {
                            child.size[0] = mainWidth.value / item.children.length;
                        }
                        if (child.dockType === 'window') {
                            child.size[0] = mainWidth.value - 250
                        }
                    } else { // 兄弟数量有变化时，按照原来比例重新分配
                        if (item.type === 'column') {
                            const total = item.children.reduce((pre, cur) => pre + cur.size[1], 0);
                            child.size[1] = mainHeight.value * child.size[1] / total;
                        } else if (item.type === 'row') {
                            const total = item.children.reduce((pre, cur) => pre + cur.size[0], 0);
                            child.size[0] = mainWidth.value * child.size[0] / total;
                        }
                    }

                    const childPosition = child.position || [0, 0];
                    childPosition[0] = startX;
                    childPosition[1] = startY;
                    child.position = childPosition;

                    if (item.type === 'column') {
                        startY += child.size[1];
                    } else if (item.type === 'row') {
                        startX += child.size[0];
                    }
                })

                calcChildrenPosition(item.children);
            }
        })
    }

    /**
     * 根据paneName判断对应的pane是否已打开，包括固定面板、浮动面板和自动隐藏面板
     * @param {*} paneName 
     * @returns 
     */
    const isPaneOpend = (paneName) => {
        if (!paneName) {
            return false;
        }
        
        function isInTree(tree) {
            if (!tree) {
                return false;
            }

            for (const node of tree) {
                if (node.data && node.data.group && node.data.group.includes(paneName)) {
                    return true;
                }
                // 如果有子节点，递归检查子节点
                if (node.children && node.children.length > 0) {
                    return isInTree(node.children);
                }
            }
            // 所有节点检查完毕未找到
            return false;
        }

        let result = false;

        // 判断autoHidePane
        for (let i = 0; i < curLayoutData.value?.autoHidePane.length; i++) {
            const group = curLayoutData.value?.autoHidePane[i].group;
            if (group && group.length) {
                let temp = group.find(j => j.comp == paneName);
                if (temp) {
                    result = true;
                    break;
                }
            }
        }
        if (result) {
            return true;
        };

        // 判断固定pane
        result = isInTree(curLayoutData.value?.children);
        if (result) {
            return true;
        }

        // 判断浮动pane
        result = isInTree(curLayoutData.value?.floatPane);
        return result;
    }

    /**
     * 更新pane的size
     * @param {*} id 
     * @param {*} ratio 比例
     * @returns 
     */
    const updatePaneSize = (id, ratio) => {
        if (!id) {
            return;
        }
        let pane = null;
        pane = getById(id);
        if (!pane) {
            pane = getFloatById(id);
        }
        if (!pane) {
            return;
        }

        if (pane.direction == 'column' && !pane.size) {
            pane.size = defaultWidthPercent.value;
        }

        if (pane.size) {
            pane.size = pane.size.replace('%', '') * ratio + '%';
        }
    }

    /**
     * 固定pane-根据子节点id获取父节点
     * @param {*} childId 
     * @returns 
     */
    const getParentByChildId = (childId) => {
        let parent = null;
        const findParent = (node) => {
            if (node && node.children && node.children.length) {
                if (node.children.some(child => child.id == childId)) {
                    parent = node;
                } else {
                    node.children.forEach(child => {
                        findParent(child);
                    })
                }
            }

        }
        findParent(curLayoutData.value);
        return parent;
    }

    /**
     * 固定pane-根据id获取pane
     * @param {*} id 
     * @returns 
     */
    const getById = (id) => {
        let pane = null;
        const findPane = (node) => {
            if (node && node.id == id) {
                pane = node;
            } else if (node && node.children && node.children.length) {
                node.children.forEach(child => {
                    findPane(child);
                })
            }
        }
        findPane(curLayoutData.value);
        return pane;
    }

    /**
     * 固定pane-根据paneName获取pane
     * @param {*} paneName 
     */
    const getByPaneName = (paneName) => {
        let pane = null;
        const findPane = (node) => {
            if (node.type == 'pane' && node.data?.group?.includes(paneName)) {
                pane = node;
            } else if (node.children && node.children.length) {
                node.children.forEach(child => {
                    findPane(child);
                })
            }
        }
        findPane(curLayoutData.value);
        return pane;
    }

    /**
     * 浮动pane-根据floatPane的id获取同一个浮动面板内所有pane
     * @param {*} id 
     * @returns 
     */
    const getAllPaneInFloat = (id) => {
        let result = [];
        if (!id) {
            return result;
        }
        const floatPane = getFloatById(id);
        if (!floatPane) {
            return result;
        }
        function findPane(float) {
            if (float.type == 'pane') {
                result.push(float);
            }
            if (float.children) {
                float.children.forEach(item => {
                    findPane(item);
                })
            }
        }

        findPane(floatPane);
        return result;
    }

    /**
     * 根据pane的id找到所属floatPane中的根节点id
     * @param {*} id 
     * @returns 
     */
    const getFloatRoot = (id) => {
        if (!id) {
            return '';
        }
        for (const rootNode of curLayoutData.value?.floatPane) {
            const stack = [{ currentNode: rootNode, root: rootNode }];
            while (stack.length > 0) {
                const { currentNode, root } = stack.pop();
                // 找到目标节点，返回其根节点
                if (currentNode.id === id) {
                    return root.id;
                }
                // 处理子节点
                if (currentNode.children && Array.isArray(currentNode.children)) {
                    // 倒序入栈以保持原始顺序
                    for (let i = currentNode.children.length - 1; i >= 0; i--) {
                        const child = currentNode.children[i];
                        if (child && typeof child === 'object') {
                            stack.push({ currentNode: child, root: root });
                        }
                    }
                }
            }
        }
        return '';
    }

    /**
     * 浮动pane-根据pane的id判断是否为当前拖动面板的子面板
     * @param {*} id 
     * @returns 
     */
    const isChildPane = (id) => {
        if (!curDragId.value) {
            return false;
        }
        const floatPane = curLayoutData.value?.floatPane.find(i => i.id == curDragId.value);
        if (!floatPane) {
            return false;
        }

        function findChild(arr) {
            for (const node of arr) {
                if (node.id == id) {
                    return true;
                }

                if (node.children && node.children.length) {
                    let found = findChild(node.children);
                    if (found) {
                        return true;
                    }
                }
            }

            return false;
        }

        if (floatPane.type == 'pane') {
            return floatPane.id == id;
        } else {
            return findChild(floatPane.children);
        }
    }

    /**
     * 浮动pane-根据id获取浮动pane
     * @param {*} id 
     * @param {*} arr 
     * @returns 
     */
    const getFloatById = (id) => {
        if (!id) {
            return null;
        }

        const findPane = (nodeArr) => {
            for (const node of nodeArr) {
                if (node.id == id) {
                    return node;
                }
                if (node.children && node.children.length > 0) {
                    let found = findPane(node.children);
                    if (found) {
                        return found;
                    }
                }
            }
            // 所有节点检查完毕未找到
            return null;
        }
        return findPane(curLayoutData.value?.floatPane);
    }
    
    /**
     * 浮动pane-根据paneName获取浮动pane
     * @param {*} paneName 
     * @param {*} arr 
     * @returns 
     */
    const getFloatByPaneName = (paneName, arr) => {
        if (!paneName) {
            return null;
        }

        const findPane = (nodeArr) => {
            if (!nodeArr) return;
            for (const node of nodeArr) {
                if (node.type == 'pane' && node.data?.group?.includes(paneName)) {
                    return node;
                }
                if (node.children && node.children.length > 0) {
                    let found = findPane(node.children);
                    if (found) {
                        return found;
                    }
                }
            }
            // 所有节点检查完毕未找到
            return null;
        }
        return findPane(curLayoutData.value?.floatPane);
    }

    /**
     * 浮动pane-根据id获取浮动pane的父节点
     * @param {*} id 
     * @param {*} arr 
     * @param {*} parent 
     * @returns 
     */
    const getFloatParentById = (id, arr, parent = null) => {
        if (!id) {
            return null;
        }
        arr = arr || curLayoutData.value?.floatPane;

        for (const node of arr) {
            // 先检查当前节点的子节点中是否包含目标节点
            if (node.children && node.children.length > 0) {
            // 遍历子节点查找目标
                for (const child of node.children) {
                    if (child.id == id) {
                        return node; // 找到目标节点，返回当前节点作为父节点
                    }
                }
                // 递归查找更深层级的子节点，当前节点作为父节点传入
                const foundParent = getFloatParentById(id, node.children, node);
                if (foundParent) return foundParent;
            }
        }
        // 未找到目标节点或目标是根节点
        return null;
    }

    /**
     * 浮动pane-清除浮动pane的float属性
     * @param {*} node 
     */
    const clearFloat = (node) => {
        delete node.float;
        if (node.children) {
            node.children.forEach(item => clearFloat(item));
        }
    }

    /**
     * 切换id对应的pane内的tab
     * @param {*} id 
     * @param {*} tab 
     * @returns 
     */
    const toggleActive = (id, tab) => {
        let pane = getById(id);
        if (!pane) {
            // 尝试在floatPane中查找
            pane = getFloatById(id);
            if (!pane) {
                return;
            }
        }
        if (pane.data.active == tab) {
            return;
        }
        if (pane.data.group.includes(tab)) {
            pane.data.active = tab;
        }
    }

    /**
     * 底部tab拖拽排序
     * @param {*} id 
     * @param {*} startTab 要排序的tab
     * @param {*} endTab 要排序的tab的目标位置
     */
    const tabSort = (id, startTab, endTab) => {
        if (!id || !startTab || !endTab) {
            return;
        }
        if (startTab == endTab) {
            return;
        }
        let pane = getById(id);
        if (!pane) {
            pane = getFloatById(id);
        }
        if (!pane || !pane.data) {
            return;
        }
        // startTab和endTab换位置
        const startIndex = pane.data.group.indexOf(startTab);
        const endIndex = pane.data.group.indexOf(endTab);
        pane.data.active = startTab;


        if (startIndex !== -1 && endIndex !== -1) {
            pane.data.group[startIndex] = endTab;
            pane.data.group[endIndex] = startTab;
        }
    }

    /**
     * 浮动面板内resize
     * @param {*} dockId 
     * @param {*} resizeDirection 
     * @param {*} resizeValue 
     * @returns 
     */
    const floatDockResize = (dockId, resizeDirection, resizeValue) => {
        const dock = getFloatById(dockId);

        if (!dock.float) return;

        switch (resizeDirection) {
            case 'n': // 向上拖动
                dock.style.height -= resizeValue.y;
                dock.style.top += resizeValue.y;
                break;
            case 'e': // 向右拖动
                dock.style.width += resizeValue.x;
                break;
            case 's': // 向下拖动
                dock.style.height += resizeValue.y;
                break;
            case 'w': // 向左拖动
                dock.style.width -= resizeValue.x;
                dock.style.left += resizeValue.x;
                break;
            case 'ne': // 东北拖动
                dock.style.width += resizeValue.x;
                dock.style.height -= resizeValue.y;
                dock.style.top += resizeValue.y;
                break;
            case 'se': // 东南拖动
                dock.style.width += resizeValue.x;
                dock.style.height += resizeValue.y;
                break;
            case 'sw': // 西南拖动
                dock.style.width -= resizeValue.x;
                dock.style.left += resizeValue.x;
                dock.style.height += resizeValue.y;
                break;
            case 'nw': // 西北拖动
                dock.style.width -= resizeValue.x;
                dock.style.left += resizeValue.x;
                dock.style.height -= resizeValue.y;
                dock.style.top += resizeValue.y;
                break;
            default:
                break;
        }
    }

    /**
     * 根据id判断对应项是否有兄弟
     * @param {*} id 
     */
    const hasSibling = (id) => {
        if (id == 'root' || !id) {
            return false;
        }
        const parent = getParentByChildId(id);
        if (!parent) {
            return false;
        }
        return parent.children.length > 1;
    }

    /**
     * 根据id获取对应项所有的兄弟(不包括id对应项)
     * @param {*} id 
     * @returns 
     */
    const getSibling = (id) => {
        if (id == 'root' || !id) {
            return [];
        }
        const parent = getParentByChildId(id);
        if (!parent) {
            return [];
        }
        return parent.children.filter(item => item.id != id);
    }


    /**
     * 根据id判断对应项在兄弟中的索引
     * @param {*} id 
     * @returns 
     */
    const getIndexInSibling = (id) => {
        if (id == 'root' || !id) {
            return -1;
        }
        const parent = getParentByChildId(id);
        if (!parent) {
            return -1;
        }
        return parent.children.findIndex(item => item.id == id);
    }

    /**
     * 移出后重新计算其余兄弟项的size
     * @param {*} sibling 原来所有兄弟项，包括移出项
     * @param {*} id 移出项id
     * @returns 
     */
    const reCalcSiblingSizeByMoveout = (sibling, id) => {
        if (!sibling.length || sibling.length == 1) {
            return [];
        }
        const idItem = sibling.find(i => i.id == id);
        const total = 100 - idItem.size;
        sibling = sibling.filter(i => i.id != id);
        let curTotal = 0;
        sibling.forEach((item, index) => {
            if (index < sibling.length - 1) {
                item.size = 100 - curTotal;;
            } else {
                item.size = item.size * 100 / total;
                curTotal += item.size;
            }
        })
        return sibling;
    }

    /**
     * 移入后重新计算所有兄弟项的size
     * @param {*} sibling 原来所有的兄弟项，包括移入项
     * @param {*} id 移入项id
     * @returns 
     */
    const reCalcSiblingSizeByMovein = (sibling, id) => {
        if (!sibling.length) {
            return sibling;
        }
        if (sibling.length == 1) {
            sibling[0].size = 100;
            return sibling;
        }

        const total = sibling.reduce((pre, cur) => pre + cur.size, 0);
        let curTotal = 0;
        sibling.forEach((item, index) => {
            if (item.id != id) {
                item.size = item.size * 100 / total;
                curTotal += item.size;
            }
        })
        const idItem = sibling.find(i => i.id == id);
        idItem.size = 100 - curTotal;
        return sibling;
    }

    /**
     * 设置id项中的tab为浮动窗口，并移动
     * @param {*} id 
     * @param {*} tab 
     */
    const setTabFloat = (id, tab, x, y) => {
        // 判断是否已经是浮动窗口
        const pane = getById(id);
        if (!pane || !pane.data) return;
        const tabIndex = pane.data.group.indexOf(tab);
        
        if (tabIndex !== -1) { // tab拖拽，生成新的浮动pane
            // 原pan删除tab
            pane.data.group.splice(tabIndex, 1);
            if (pane.data.active == tab) {
                pane.data.active = pane.data.group[0];
            }
            // tab包装在新建的floatPane中
            const floatId = floatPaneIdPrefix.value + generateRandomId();
            const paneDom = document.getElementById(id);
            const paneRect = paneDom.getBoundingClientRect();

            const floatPane = {
                id: floatId,
                type: 'pane',
                float: true,
                direction: 'column',
                data: {
                    active: tab,
                    group: [tab]
                },
                style: {
                    width: paneRect.width > defaultWidth.value ? defaultWidth.value : paneRect.width,
                    height: paneRect.height > mainHeight.value / 2 ? mainHeight.value / 2 : paneRect.height,
                    left: x - 30,
                    top: y - mainHeight.value / 2 + 30
                }
            }
            curLayoutData.value?.floatPane.unshift(floatPane);
            curActive.value = floatId;
        } else { // 移动
            nextTick(() => {
                const floatPane = curLayoutData.value?.floatPane[0];
                const floatPaneDom = document.querySelector(`#${floatPane.id}`)
                const floatPaneRect = floatPaneDom.getBoundingClientRect();
                
                if (floatPane) {
                    setFloatPanePosition(floatPane.id, {
                        left: x - 30,
                        top: y - floatPaneRect.height + 30
                    });
                }
                curDragId.value = floatPane.id
            })
        }
    }

    /**
     * 设置浮动窗口中的tab为浮动窗口，并移动
     * @param {*} id 
     * @param {*} tab 
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
    const setFloatTabFloat = (id, tab, x, y) => {
        const pane = getFloatById(id);
        if (!pane || !pane.data) {
            return;
        }

        const tabIndex = pane.data.group.indexOf(tab);
        
        if (tabIndex !== -1) { // tab拖拽，生成新的浮动pane
            // 原pane删除tab
            pane.data.group.splice(tabIndex, 1);
            if (pane.data.active == tab) {
                pane.data.active = pane.data.group[0];
            }
            // tab包装在新建的floatPane中
            const floatId = floatPaneIdPrefix.value + generateRandomId();
            const paneDom = document.getElementById(id);
            const paneRect = paneDom.getBoundingClientRect();

            const floatPane = {
                id: floatId,
                type: 'pane',
                float: true,
                direction: 'column',
                data: {
                    active: tab,
                    group: [tab]
                },
                style: {
                    width: paneRect.width > defaultWidth.value ? defaultWidth.value : paneRect.width,
                    height: paneRect.height > mainHeight.value / 2 ? mainHeight.value / 2 : paneRect.height,
                    left: x - 30,
                    top: y - mainHeight.value / 2 + 30
                }
            };
            curLayoutData.value?.floatPane.unshift(floatPane);
            curActive.value = floatId;
        } else { //  移动
            nextTick(() => {
                const floatPane = curLayoutData.value?.floatPane[0];
                const floatPaneDom = document.querySelector(`#${floatPane.id}`)
                const floatPaneRect = floatPaneDom.getBoundingClientRect();
                
                if (floatPane) {
                    setFloatPanePosition(floatPane.id, {
                        left: x - 30,
                        top: y - floatPaneRect.height + 30
                    });
                }
                curDragId.value = floatPane.id
            })
        }
        
    }

    /**
     * 浮动pane-将id对应的pane设置为新的浮动pane
     * @param {*} id 
     */
    const setFloatPaneToNewFloat = (id, clientX, clientY) => {
        if (!id) {
            return;
        }
        const pane = getFloatById(id);
        if (!pane) {
            return;
        }
        const parent = getFloatParentById(id);

        if (!parent) {
            return
        }
        parent.children.splice(parent.children.indexOf(pane), 1);

        // if (parent.children.length == 1) {
        //     parent.type = parent.children[0].type;
        //     parent.data = parent.children[0].data;
        //     parent.direction = 'column';
        //     delete parent.children;
        // }
        parent.children.forEach(item => {
            if (item.id !== id && item.size) {
                let size = item.size.replace('%', '') / (100 - pane.size.replace('%', '')) * 100;
                size = size > 100 ? 100 : size;
                item.size = size + '%';
            }
        })

        updateParent(parent.children[0].id);
        function updateParent(id) {
            if (!id) return;

            let parent = getFloatParentById(id);
            if (!parent) return;

            if (parent.children && parent.children.length == 1) {
                if (parent.id == 'root') {
                    parent.direction = 'column';
                } else if (parent.children[0].type) {
                    parent.type = parent.children[0].type;
                    parent.data = parent.children[0].data;
                    delete parent.children;
                } else {
                    let direction = parent.children[0].children[0].direction
                    if (parent.direction == parent.children[0].children[0].direction) {
                        let pParent = getFloatParentById(parent.id);
                        let index = pParent.children.indexOf(parent);
                        let newChildren = [];
                        parent.children[0].children.forEach(item => {
                            newChildren.push(item);
                        })
                        pParent.children.splice(index, 1, ...newChildren)
                    } else {
                        parent.children = parent.children[0].children;
                    }
                    parent.direction = direction;
                }

                updateParent(parent.id)
            }
        }

        const paneDom = document.getElementById(id);
        const rect = paneDom.getBoundingClientRect();

        const rootDom = document.getElementById('root');
        const rootRect = rootDom.getBoundingClientRect();

        const floatRenderId = floatPaneIdPrefix.value + generateRandomId()
        curLayoutData.value?.floatPane.unshift({
            id: floatRenderId,
            direction: 'column',
            type: pane.type,
            data: pane.data,
            float: true,
            style: {
                width: rect.width > defaultWidth.value ? defaultWidth.value : rect.width,
                height: rect.height > rootRect.height / 2 ? rootRect.height / 2 : rect.height,
                left: rect.width > defaultWidth.value ? clientX - defaultWidth.value / 2 : rect.left - rootRect.left,
                top: clientY - rootRect.top - 10
            }
        })

        curActive.value = floatRenderId;
        curDragId.value = floatRenderId;
    }

    /**
     * 设置整个浮动面板组取消浮动
     * @param {*} id 
     */
    const unSetRootPaneFloat = (id) => {
        if (!id) return;
        if (!id.startsWith(floatPaneIdPrefix.value)) return;
        let pane = getFloatById(id);
        const index = curLayoutData.value?.floatPane.findIndex(i => i.id == id);
        if (index == -1) return;
        curLayoutData.value?.floatPane.splice(index, 1);
        pane = JSON.parse(JSON.stringify(pane));
        if (!pane) return;

        clearFloat(pane);
        delete pane.style
        if (pane.direction == 'row') {
            pane.direction = 'column';
            pane.size = defaultWidthPercent.value;
            curLayoutData.value?.children.unshift(pane);
        } else {
            pane.children.forEach(item => {
                item.size = item.size.replace('%', '') * defaultWidthPercent.value.replace('%', '') / 100 + '%'
            })
            curLayoutData.value?.children.unshift(...pane.children);
        }
    }

    /**
     * 设置浮动面板组中的单个面板取消浮动
     * @param {*} id 
     * @returns 
     */
    const unSetPaneFloat = (id) => {
        if (!id) return;
        let pane = getFloatById(id);
        if (!pane) return;
        if (id.startsWith(floatPaneIdPrefix.value)) {
            // 直接删除这个floatPane，并生成固定pane
            const index = curLayoutData.value?.floatPane.findIndex(i => i.id == id);
            if (index !== -1) {
                curLayoutData.value?.floatPane.splice(index, 1);
                insertPane(null, 'root', 'left', null, {
                    active: pane.data.active,
                    group: pane.data.group
                });
            }
        } else {
            const parent = getFloatParentById(id);
            if (!parent) return;
            parent.children.splice(parent.children.indexOf(pane), 1);
            parent.children.forEach(item => {
                if (item.id !== id && item.size) {
                    let size = item.size.replace('%', '') / (100 - pane.size.replace('%', '')) * 100;
                    size = size > 100 ? 100 : size;
                    item.size = size + '%';
                }
            })

            updateParent(parent.children[0].id);
            function updateParent(id) {
                if (!id) return;

                let parent = getFloatParentById(id);
                if (!parent) return;

                if (parent.children && parent.children.length == 1) {
                    if (parent.id == 'root') {
                        parent.direction = 'column';
                    } else if (parent.children[0].type) {
                        parent.type = parent.children[0].type;
                        parent.data = parent.children[0].data;
                        delete parent.children;
                    } else {
                        let direction = parent.children[0].children[0].direction
                        if (parent.direction == parent.children[0].children[0].direction) {
                            let pParent = getFloatParentById(parent.id);
                            let index = pParent.children.indexOf(parent);
                            let newChildren = [];
                            parent.children[0].children.forEach(item => {
                                newChildren.push(item);
                            })
                            pParent.children.splice(index, 1, ...newChildren)
                        } else {
                            parent.children = parent.children[0].children;
                        }
                        parent.direction = direction;
                    }

                    updateParent(parent.id)
                }
            }

            insertPane(null, 'root', 'left', null, {
                active: pane.data.active,
                group: pane.data.group
            });
        }
        
    }

    /**
     * 根据id设置对应项为浮动窗口
     * @param {*} id 
     */
    const setPaneFloat = (id, clientX, clientY, isWholePane = false, initDrag = false) => {
        if (!id) {
            return;
        }
        let pane = getById(id);
        if (!pane) {
            return;
        }
        const parent = getParentByChildId(id);
        if (!parent) {
            return;
        }   

        const paneDom = document.getElementById(id);
        const rect = paneDom.getBoundingClientRect();

        const rootDom = document.getElementById('root');
        const rootRect = rootDom.getBoundingClientRect();
        // pane.style = {
        //     width: rect.width > defaultWidth.value ? defaultWidth.value : rect.width,
        //     height: rect.height > rootRect.height / 2 ? rootRect.height / 2 : rect.height,
        //     left: rect.width > defaultWidth.value ? clientX - defaultWidth.value / 2 : rect.left - rootRect.left,
        //     top: rect.top - rootRect.top
        // }
        const floatRenderId = floatPaneIdPrefix.value + generateRandomId()
        let data = {};
        if (isWholePane) {
            data = {
                active: pane.data.active,
                group: pane.data.group
            }
        } else {
            data = {
                active: pane.data.active,
                group: [pane.data.active]
            }
        }
        curLayoutData.value?.floatPane.unshift({
            id: floatRenderId,
            direction: 'column',
            data: data,
            type: pane.type,
            float: true,
            style: {
                width: rect.width > defaultWidth.value ? defaultWidth.value : rect.width,
                height: rect.height > rootRect.height / 2 ? rootRect.height / 2 : rect.height,
                left: rect.width > defaultWidth.value ? clientX - defaultWidth.value / 2 : rect.left - rootRect.left,
                top: clientY ? clientY : rect.top - rootRect.top
            }

        });

        if (initDrag) {
            curDragId.value = floatRenderId;
        }

        curActive.value = floatRenderId;
        if (isWholePane) {
            closePane(id);
        } else {
            closeTabInPane(id, pane.data.active);
        }
    }

    /**
     * 设置浮动pane的位置
     * @param {*} id 
     * @param {*} position 
     * @returns 
     */
    const setFloatPanePosition = (id, position) => {
        if (!id) {
            return;
        }
        const pane = curLayoutData.value?.floatPane.find(item => item.id == id);

        if (!pane || !pane.float) {
            return;
        }
        pane.style.left = position.left;
        pane.style.top = position.top;
        curDragId.value = id;
    }

    /**
     * 关闭固定pane
     * @param {*} id pane id
     */
    const closePane = (id) => {
        if (!id) {
            return Promise.reject(false);
        }
        let pane = getById(id);
        if (!pane) {
            return Promise.reject(false);
        }
        const parent = getParentByChildId(id);
        if (!parent) {
            return Promise.reject(false);
        }

        // 判断parent的children中是否有包含window的
        let childContainWindow = parent.children.find(i => isContainWindow(i.id));
        if (childContainWindow) {
            // 不用处理size,可能有问题,但目前没发现。
        } else {
            parent.children.forEach(item => {
                if (item.id !== id && item.size) {
                    let size = item.size.replace('%', '') / (100 - pane.size.replace('%', '')) * 100;
                    size = size > 100 ? 100 : size;
                    item.size = size + '%';
                }
            })
        }

        parent.children.splice(parent.children.indexOf(pane), 1);
        if (parent.children.length > 0) {
            updateParent(parent.children[0].id);
        } else {
            const grandParent = getParentByChildId(parent.id);
            if (grandParent) {
                const index = grandParent.children.indexOf(parent);
                if (index > -1) {
                    grandParent.children.splice(index, 1);
                    if (grandParent.children.length > 0) {
                        updateParent(grandParent.children[0].id);
                    }
                }
            }
        }

        function updateParent(id) {
            if (!id) return;

            if (id == 'window') return;

            let parent = getParentByChildId(id);
            if (!parent) return;

            if (parent.children && parent.children.length == 1) {
                if (parent.id == 'root') {
                    if (parent.children[0].children) {
                        parent.direction = parent.children[0].children[0].direction;
                        parent.children = parent.children[0].children;
                    } else {
                        parent.direction = 'column'
                        parent.children = [parent.children[0]];
                    }
                } else if (parent.children[0].type) {
                    parent.type = parent.children[0].type;
                    parent.data = parent.children[0].data;
                    delete parent.children;
                } else {
                    let direction = parent.children[0].children[0].direction
                    if (parent.direction == parent.children[0].children[0].direction) {
                        let pParent = getParentByChildId(parent.id);
                        let index = pParent.children.indexOf(parent);
                        let newChildren = [];
                        parent.children[0].children.forEach(item => {
                            newChildren.push(item);
                        })
                        pParent.children.splice(index, 1, ...newChildren)
                    } else {
                        parent.children = parent.children[0].children;
                    }
                    parent.direction = direction;
                }

                updateParent(parent.id)
            }
        }
        return Promise.resolve(pane);
    }

    /**
     * 关闭固定pane中的tab
     * @param {*} id 
     * @param {*} tab 
     */
    const closeTabInPane = (id, tab) => {
        if (!id) return;

        let pane = getById(id);
        if (!pane || !pane.data) return;

        if (pane.data.group.length == 1) {
            closePane(id);
        } else {
            pane.data.group.splice(pane.data.group.indexOf(tab), 1);
            if (pane.data.active == tab) {
                pane.data.active = pane.data.group[0];
            }
        }
    }

    /**
     * 关闭浮动pane
     * @param {*} id pane id
     */
    const closeFloatPane = (id) => {
        if (!id) {
            return Promise.reject(false);
        }
        let pane = getFloatById(id);
        if (!pane) {
            return Promise.reject(false);
        }

        if (pane.id.startsWith(floatPaneIdPrefix.value)) {
            curLayoutData.value?.floatPane.splice(curLayoutData.value?.floatPane.indexOf(pane), 1);
            return Promise.resolve(true);
        }

        const parent = getFloatParentById(id);
        if (!parent) {
            return Promise.reject(false);
        }

        if (pane.direction == 'column') { // pane的宽度平均分给其他兄弟节点
            parent.children.forEach(item => {
                if (item.id !== id && item.size) {
                    let size = item.size.replace('%', '') / (100 - pane.size.replace('%', '')) * 100;
                    size = size > 100 ? 100 : size;
                    item.size = size + '%';
                }
            })
        }

        const floatRootId = getFloatRoot(id);
        const paneArr = getAllPaneInFloat(floatRootId)
        if (paneArr.length == 1) {
            const floatPaneIndex = curLayoutData.value?.floatPane.findIndex(i => i.id == floatRootId);
            curLayoutData.value?.floatPane.splice(floatPaneIndex, 1);
            return Promise.resolve(true);
        } 
        parent.children.splice(parent.children.indexOf(pane), 1);

        updateParent(parent.children[0].id);
        function updateParent(id) {
            if (!id) return;

            let parent = getFloatParentById(id);
            if (!parent) return;

            if (parent.children && parent.children.length == 1) {
                if (parent.children[0].type) {
                    parent.type = parent.children[0].type;
                    parent.data = parent.children[0].data;
                    delete parent.children;
                } else {
                    let direction = parent.children[0].children[0].direction
                    if (parent.direction == parent.children[0].children[0].direction) {
                        let pParent = getFloatParentById(parent.id);
                        let index = pParent.children.indexOf(parent);
                        let newChildren = [];
                        parent.children[0].children.forEach(item => {
                            newChildren.push(item);
                        })
                        pParent.children.splice(index, 1, ...newChildren)
                    } else {
                        parent.children = parent.children[0].children;
                    }
                    parent.direction = direction;
                }

                updateParent(parent.id)
            }
        }

        Promise.resolve(true);
    }

    /**
     * 设置固定pane为autoHide
     * @param {*} id 
     */
    const setPanePin = async (id) => {
        let pane = await closePane(id);
        if (!pane) {
            return;
        }
        curLayoutData.value?.autoHidePane.push({
            id: pane.id,
            group: pane.data.group.map(i => {
                return {
                    id: generateRandomId(),
                    comp: i
                }
            })
        })
    }

    /**
     * 取消设置pane为autoHide
     * @param {*} id 
     */
    const setPaneUnpin = (id, comp) => {
        const autoHidePaneIndex = curLayoutData.value?.autoHidePane.findIndex(item => item.group.some(i => i.id == id));
        const autoHidePane = curLayoutData.value?.autoHidePane[autoHidePaneIndex];

        const sourcePane = {
            id: autoHidePane.id,
            direction: 'column',
            type: 'pane',
            size: defaultWidthPercent.value,
            data: {
                active: comp || autoHidePane.group[0].comp,
                group: autoHidePane.group.map(i => i.comp)
            }
        }
        const targetPane = getById('root');
        if (targetPane.direction == 'row') {
            let newChildren = [
                sourcePane,
                {
                    id: generateRandomId(),
                    direction: 'column',
                    size: 100 - defaultWidthPercent.value.replace('%', '') + '%',
                    children: [...targetPane.children]
                }
            ];
            targetPane.direction = 'column';
            targetPane.children = newChildren;
        } else if (targetPane.direction == 'column') {
            targetPane.children.unshift(sourcePane);
        }

        curLayoutData.value?.autoHidePane.splice(autoHidePaneIndex, 1);

    }

    /**
     * 判断id对应的pane内是否包含window
     * @param {*} id 
     * @returns 
     */
    const isContainWindow = (id) => {
        if (id == 'window') {
            return true;
        }
        const pane = getById(id);
        if (!pane) {
            return false;
        }
        if (pane.children && pane.children.length) {
            for (let i = 0; i < pane.children.length; i++) {
                const child = pane.children[i];
                if (isContainWindow(child.id)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 均分arr以及所有children的size属性
     * @param {*} arr 
     */
    const setSize = (arr) => {
        if (!arr) return;
        arr.forEach(item => {
            item.size = 100 / arr.length + '%';
            if (item.children) {
                setSize(item.children);
            }
        })
    }

    /**
     * size计算
     * @param {*} size 原始大小，支持数字和百分比
     * @param {*} ratio 计算比例，支持数字和百分比
     */
    const calcSize = (size, ratio) => {
        if (!size) {
            return undefined;
        }
        if ((size + '').endsWith('%')) {
            if ((ratio + '').endsWith('%')) {
                return size.replace('%', '') * Number(ratio.replace('%', '')) / 100 + '%';
            } else {
                return size.replace('%', '') * ratio + '%';
            }
        } else {
            if ((ratio + '').endsWith('%')) {
                return Number(size) * Number(ratio.replace('%', '')) / 100;
            } else {
                return Number(size) * ratio;
            }
        }
    }

    /**
     * 将pane插入到非浮动pane中
     * @param {*} sourceId 要插入的pane的id
     * @param {*} targetId 要插入的位置的pane的id
     * @param {*} direction 插入的方向
     */
    const insertPane = (sourceId, targetId, direction, insertPaneName, data) => {
        // sourceId无值时，表示新增pane
        let sourcePane = null;
        if (!sourceId) {
            if (data) {
                sourcePane = {
                    id: generateRandomId(),
                    direction: 'column',
                    type: 'pane',
                    size: defaultWidthPercent.value,
                    data: data
                }
            } else {
                sourcePane = {
                    id: generateRandomId(),
                    direction: 'column',
                    type: 'pane',
                    size: defaultWidthPercent.value,
                    data: {
                        active: insertPaneName,
                        group: [insertPaneName]
                    }
                }
            }

        } else {
            // 拖动的pane
            sourcePane = curLayoutData.value?.floatPane.find(item => item.id == sourceId);
        }


        if (sourcePane) {
            delete sourcePane.style;
            delete sourcePane.float;
        }
        // 目标pane root
        let targetPane = getById(targetId);
        if (!targetPane) {
            targetPane = getFloatById(targetId);
            if (!targetPane) {
                return;
            }
        }

        let newChildren = [];
        let originalChildren = [];
        let childContainWindow = null;
        let childContainWindowRect = null;
        let childContainWindowIndex = -1;
        let childContainWindowSize = 0;
        let targetParent = null;
        let targetIndex = -1;
        let size = 0;
        let newTarget = null;
        let targetRect = null;

        targetPane.children = targetPane.children || [];
        
        if (targetId == 'root') {
            if (targetPane.direction == 'row') {
                if (sourcePane.direction == 'row') {
                    switch (direction) {
                        case 'top':
                            childContainWindow = targetPane.children.find(i => isContainWindow(i.id));
                            if (childContainWindow.size.replace('%', '') >= defaultHeight.value.replace('%', '') * 2) {
                                size = defaultHeight.value;
                                childContainWindow.size = childContainWindow.size.replace('%', '') - defaultHeight.value.replace('%', '') + '%';
                            } else {
                                size = childContainWindow.size.replace('%', '') / 2 + '%';
                                childContainWindow.size = childContainWindow.size.replace('%', '') / 2 + '%'
                            }
                            clearFloat(sourcePane);
                            
                            targetPane.children.unshift({
                                id: generateRandomId(),
                                direction: 'row',
                                size: size,
                                children: [{
                                    id: generateRandomId(),
                                    direction: 'column',
                                    size: '100%',
                                    children: sourcePane.children
                                }]
                            })
                            break;
                        case 'right':
                            clearFloat(sourcePane);
                            targetPane.children = [
                                {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    size: (mainWidth.value - defaultWidth.value) / mainWidth.value * 100 + '%',
                                    children: [...targetPane.children]
                                },
                                {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    size: defaultWidthPercent.value,
                                    children: sourcePane.children
                                },
                            ];
                            targetPane.direction = 'column';
                            break;
                        case 'bottom':
                            childContainWindow = targetPane.children.find(i => isContainWindow(i.id));
                            if (childContainWindow.size.replace('%', '') >= defaultHeight.value.replace('%', '') * 2) {
                                size = defaultHeight.value;
                                childContainWindow.size = childContainWindow.size.replace('%', '') - defaultHeight.value.replace('%', '') + '%';
                            } else {
                                size = childContainWindow.size.replace('%', '') / 2 + '%';
                                childContainWindow.size = childContainWindow.size.replace('%', '') / 2 + '%'
                            }
                            clearFloat(sourcePane);
                            
                            targetPane.children.push({
                                id: generateRandomId(),
                                direction: 'row',
                                size: size,
                                children: [{
                                    id: generateRandomId(),
                                    direction: 'column',
                                    size: '100%',
                                    children: sourcePane.children
                                }]
                            })
                            break;
                        case 'left':
                            clearFloat(sourcePane);
                            targetPane.children = [
                                {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    size: defaultWidthPercent.value,
                                    children: sourcePane.children
                                },
                                {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    size: (mainWidth.value - defaultWidth.value) / mainWidth.value * 100 + '%',
                                    children: [...targetPane.children]
                                }
                            ];
                            targetPane.direction = 'column';
                            break;
                        default:
                            break;
                    }
                } else if (sourcePane.direction == 'column') {
                    switch (direction) {
                        case 'top':
                            clearFloat(sourcePane);
                            childContainWindow = targetPane.children.find(i => isContainWindow(i.id));
                            if (childContainWindow.size.replace('%', '') >= defaultHeight.value.replace('%', '') * 2) {
                                size = defaultHeight.value;
                                childContainWindow.size = childContainWindow.size.replace('%', '') - defaultHeight.value.replace('%', '') + '%';
                            } else {
                                size = childContainWindow.size.replace('%', '') / 2 + '%';
                                childContainWindow.size = childContainWindow.size.replace('%', '') / 2 + '%'
                            }
                            if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                                targetPane.children.unshift({
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: size,
                                    type: 'pane',
                                    data: sourcePane.data
                                })
                            } else { // 浮动窗口多个pane的情况
                                newChildren = sourcePane.children;
                                setSize(sourcePane.children);
                                targetPane.children.unshift({
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: size,
                                    children: newChildren
                                })
                            }
                            break;
                        case 'right':
                            if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                                sourcePane.id = generateRandomId();
                                sourcePane.size = defaultWidthPercent.value;
                                newChildren = [
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: (mainWidth.value - defaultWidth.value) / mainWidth.value * 100 + '%',
                                        children: [...targetPane.children]
                                    },
                                    sourcePane
                                ]
                            } else { // 浮动窗口多个pane的情况
                                newChildren = [
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: (mainWidth.value - defaultWidth.value) / mainWidth.value * 100 + '%',
                                        children: [...targetPane.children]
                                    },
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: defaultWidthPercent.value,
                                        children: [
                                            {
                                                id: generateRandomId(),
                                                direction: 'row',
                                                size: '100%',
                                                children: sourcePane.children
                                            }
                                        ]
                                    }
                                ]
                            }
                            targetPane.children = newChildren;
                            targetPane.direction = 'column';
                            break;
                        case 'bottom':
                            clearFloat(sourcePane);
                            childContainWindow = targetPane.children.find(i => isContainWindow(i.id));
                            if (childContainWindow.size.replace('%', '') >= defaultHeight.value.replace('%', '') * 2) {
                                size = defaultHeight.value;
                                childContainWindow.size = childContainWindow.size.replace('%', '') - defaultHeight.value.replace('%', '') + '%';
                            } else {
                                size = childContainWindow.size.replace('%', '') / 2 + '%';
                                childContainWindow.size = childContainWindow.size.replace('%', '') / 2 + '%'
                            }

                            if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                                targetPane.children.push({
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: size,
                                    type: 'pane',
                                    data: sourcePane.data
                                })
                            } else { // 浮动窗口多个pane的情况
                                newChildren = sourcePane.children;
                                setSize(sourcePane.children);
                                targetPane.children.push({
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: size,
                                    children: newChildren
                                })
                            }
                            break;
                        case 'left':
                            if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                                sourcePane.id = generateRandomId();
                                sourcePane.size = defaultWidthPercent.value;
                                newChildren = [
                                    sourcePane,
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: (mainWidth.value - defaultWidth.value) / mainWidth.value * 100 + '%',
                                        children: [...targetPane.children]
                                    },
                                ]
                            } else { // 浮动窗口多个pane的情况
                                newChildren = [
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: defaultWidthPercent.value,
                                        children: [
                                            {
                                                id: generateRandomId(),
                                                direction: 'row',
                                                size: '100%',
                                                children: sourcePane.children
                                            }
                                        ]
                                    },
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: (mainWidth.value - defaultWidth.value) / mainWidth.value * 100 + '%',
                                        children: [...targetPane.children]
                                    },
                                ]
                            }
                            targetPane.children = newChildren;
                            targetPane.direction = 'column';
                            break;
                        default:
                            break;
                    }
                }
            } else if (targetPane.direction == 'column') {
                if (sourcePane.direction == 'row') {
                    switch (direction) {
                        case 'top': // 123
                            clearFloat(sourcePane);
                            targetPane.children = [
                                {
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: defaultHeight.value,
                                    children: [{
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: '100%',
                                        children: sourcePane.children
                                    }]
                                },
                                {
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: 100 - defaultHeight.value.replace('%', '') + '%',
                                    children: [...targetPane.children]
                                }
                            ];
                            targetPane.direction = 'row';
                            break;
                        case 'right': // 123
                            childContainWindow = targetPane.children.find(i => isContainWindow(i.id));
                            if (childContainWindow.size) {
                                childContainWindow.size = childContainWindow.size.replace('%', '') - defaultWidthPercent.value.replace('%', '') + '%';
                            }
                            targetPane.children.push({
                                id: generateRandomId(),
                                direction: 'column',
                                size: defaultWidthPercent.value,
                                children: sourcePane.children
                            })
                            break;
                        case 'bottom': // 123
                            clearFloat(sourcePane);
                            targetPane.children = [
                                {
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: 100 - defaultHeight.value.replace('%', '') + '%',
                                    children: [...targetPane.children]
                                },
                                {
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: defaultHeight.value,
                                    children: [{
                                        id: generateRandomId(),
                                        direction: 'column',
                                        size: '100%',
                                        children: sourcePane.children
                                    }]
                                }
                            ];
                            targetPane.direction = 'row';
                            break;
                        case 'left': // 123
                            childContainWindow = targetPane.children.find(i => isContainWindow(i.id));
                            if (childContainWindow.size) {
                                childContainWindow.size = childContainWindow.size.replace('%', '') - defaultWidthPercent.value.replace('%', '') + '%';
                            }
                            targetPane.children.unshift({
                                id: generateRandomId(),
                                direction: 'column',
                                children: sourcePane.children
                            })
                            break;
                        default:
                            break;
                    }
                } else if (sourcePane.direction == 'column') {
                    switch (direction) {
                        case 'top': // 123
                            clearFloat(sourcePane);
                            sourcePane.id = generateRandomId();

                            newChildren = [
                                {
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: (targetPane.size || '100%').replace('%', '') - defaultHeight.value.replace('%', '') + '%',
                                    children: [...targetPane.children]
                                }
                            ]
                            if (sourcePane.children) {
                                setSize(sourcePane.children);
                                newChildren.unshift({
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: defaultHeight.value,
                                    children: sourcePane.children
                                })
                            } else {
                                sourcePane.size = defaultHeight.value;
                                sourcePane.direction = 'row'
                                newChildren.unshift(sourcePane)
                            }

                            targetPane.children = newChildren;
                            targetPane.direction = 'row';
                            break;
                        case 'right': // 123
                            clearFloat(sourcePane);
                            delete sourcePane.size;
                            sourcePane.id = generateRandomId();
                            if (sourcePane.children) {
                                sourcePane.children.forEach(item => {
                                    if (item.size) {
                                        item.size = calcSize(defaultWidth.value / mainWidth.value * 100 + '%', item.size);
                                    }
                                })
                                targetPane.children.push(...sourcePane.children);
                            } else {
                                sourcePane.size = defaultWidthPercent.value;
                                targetPane.children.push(sourcePane);
                            }
                            break;
                        case 'bottom': // 123
                            clearFloat(sourcePane);
                            sourcePane.id = generateRandomId();

                            newChildren = [
                                {
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: (targetPane.size || '100%').replace('%', '') - defaultHeight.value.replace('%', '') + '%',
                                    children: [...targetPane.children]
                                }
                            ]
                            if (sourcePane.children) {
                                newChildren.push({
                                    id: generateRandomId(),
                                    direction: 'row',
                                    size: defaultHeight.value,
                                    children: sourcePane.children
                                })
                            } else {
                                sourcePane.size = defaultHeight.value;
                                sourcePane.direction = 'row'
                                newChildren.push(sourcePane)
                            }

                            targetPane.children = newChildren;
                            targetPane.direction = 'row';
                            break;
                        case 'left': // 123
                            clearFloat(sourcePane);
                            delete sourcePane.size;
                            sourcePane.id = generateRandomId();
                            if (sourcePane.children) {
                                sourcePane.children.forEach(item => {
                                    if (item.size) {
                                        item.size = calcSize(defaultWidth.value / mainWidth.value * 100 + '%', item.size);
                                    }
                                })
                                targetPane.children.unshift(...sourcePane.children);
                            } else {
                                sourcePane.size = defaultWidthPercent.value;
                                targetPane.children.unshift(sourcePane);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }

        } else if (targetPane.direction == 'row') {
            if (sourcePane.direction == 'row') {
                switch (direction) {
                    case 'top':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        childContainWindow = curLayoutData.value?.children.find(i => isContainWindow(i.id));
                        childContainWindowIndex = curLayoutData.value?.children.indexOf(childContainWindow);
                        childContainWindow.size = childContainWindow.size.replace('%', '') - defaultHeight.value.replace('%', '') + '%';
                        if (childContainWindow.size.replace('%', '') >= defaultHeight.value.replace('%', '') * 2) {
                            size = defaultHeight.value;
                        } else {
                            size = childContainWindow.size.replace('%', '') / 2 + '%';
                        }
                        curLayoutData.value.children[childContainWindowIndex].size = childContainWindow.size.replace('%', '') - size.replace('%', '') + '%';

                        newChildren = sourcePane.children.map(item => {
                            let temp = {
                                id: item.id,
                                direction: item.direction,
                                size: size.replace('%', '') * item.size.replace('%', '') / 100 + '%',
                            }
                            if (item.children) {
                                temp.children = item.children;
                            }
                            if (item.type == 'pane') {
                                temp.type = 'pane';
                                temp.data = item.data;
                            }
                            return temp;
                        })
                        targetParent.children.splice(targetIndex, 0, ...newChildren);
                        break;
                    case 'right':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.size = '50%';
                        targetPane.direction = 'column';
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        sourcePane.id = generateRandomId();
                        sourcePane.size = '50%';
                        sourcePane.direction = 'column';
                        targetParent.children.splice(targetIndex, 1, {
                            id: generateRandomId(),
                            direction: 'row',
                            size: size,
                            children: [
                                targetPane,
                                sourcePane
                            ]
                        });
                        break;
                    case 'bottom':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        childContainWindow = curLayoutData.value?.children.find(i => isContainWindow(i.id));
                        childContainWindowIndex = curLayoutData.value?.children.indexOf(childContainWindow);
                        childContainWindow.size = childContainWindow.size.replace('%', '') - defaultHeight.value.replace('%', '') + '%';
                        if (childContainWindow.size.replace('%', '') >= defaultHeight.value.replace('%', '') * 2) {
                            size = defaultHeight.value;
                        } else {
                            size = childContainWindow.size.replace('%', '') / 2 + '%';
                        }
                        curLayoutData.value.children[childContainWindowIndex].size = childContainWindow.size.replace('%', '') - size.replace('%', '') + '%';

                        newChildren = sourcePane.children.map(item => {
                            let temp = {
                                id: item.id,
                                direction: item.direction,
                                size: size.replace('%', '') * item.size.replace('%', '') / 100 + '%',
                            }
                            if (item.children) {
                                temp.children = item.children;
                            }
                            if (item.type == 'pane') {
                                temp.type = 'pane';
                                temp.data = item.data;
                            }
                            return temp;
                        })
                        targetParent.children.splice(targetIndex + 1, 0, ...newChildren);
                        break;
                    case 'left':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.size = '50%';
                        targetPane.direction = 'column';
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        sourcePane.id = generateRandomId();
                        sourcePane.size = '50%';
                        sourcePane.direction = 'column';
                        targetParent.children.splice(targetIndex, 1, {
                            id: generateRandomId(),
                            direction: 'row',
                            size: size,
                            children: [
                                sourcePane,
                                targetPane
                            ]
                        });
                        break;
                    case 'center':
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        })
                        targetPane.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            } else if (sourcePane.direction == 'column') {
                switch (direction) {
                    case 'top':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.size = calcSize(size, 0.5);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.id = generateRandomId();
                            sourcePane.size = targetPane.size;
                            sourcePane.direction = 'row'
                            targetParent.children.splice(targetIndex, 0, sourcePane);
                        } else { // 浮动窗口多个pane的情况
                            newChildren = sourcePane.children.map(item => {
                                let temp = {
                                    id: item.id,
                                    direction: item.direction,
                                    size: calcSize('100%', 1 / sourcePane.children.length),
                                }
                                if (item.children) {
                                    temp.children = item.children;
                                }
                                if (item.type == 'pane') {
                                    temp.type = 'pane';
                                    temp.data = item.data;
                                }
                                return temp;
                            })
                            targetParent.children.splice(targetIndex, 0, {
                                id: generateRandomId(),
                                direction: 'row',
                                size: calcSize(size, 0.5),
                                children: newChildren
                            });
                        }
                        break;
                    case 'right':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.size = '50%';
                        targetPane.direction = 'column';
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.direction = 'column';
                            sourcePane.id = generateRandomId();
                            sourcePane.size = '50%';
                            targetParent.children.splice(targetIndex, 1, {
                                id: 'idabc',
                                direction: 'row',
                                size: size,
                                children: [
                                    targetPane,
                                    sourcePane
                                ]
                            });
                        } else { // 浮动窗口多个pane的情况
                            newChildren = sourcePane.children.map(item => {
                                let temp = {
                                    id: item.id,
                                    direction: item.direction,
                                    size: 50 * item.size.replace('%', '') / 100 + '%',
                                }
                                if (item.children) {
                                    temp.children = item.children;
                                }
                                if (item.type == 'pane') {
                                    temp.type = 'pane';
                                    temp.data = item.data;
                                }
                                return temp;
                            })
                            targetParent.children.splice(targetIndex, 1, {
                                id: 'idabc',
                                direction: 'row',
                                size: size,
                                children: [
                                    targetPane,
                                    ...newChildren
                                ]
                            });
                        }
                        break;
                    case 'bottom':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.size = calcSize(size, 0.5);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.id = generateRandomId();
                            sourcePane.size = targetPane.size;
                            sourcePane.direction = 'row'
                            targetParent.children.splice(targetIndex + 1, 0, sourcePane);
                        } else { // 浮动窗口多个pane的情况
                            newChildren = sourcePane.children.map(item => {
                                let temp = {
                                    id: item.id,
                                    direction: item.direction,
                                    size: calcSize('100%', 1 / sourcePane.children.length),
                                }
                                if (item.children) {
                                    temp.children = item.children;
                                }
                                if (item.type == 'pane') {
                                    temp.type = 'pane';
                                    temp.data = item.data;
                                }
                                return temp;
                            })
                            targetParent.children.splice(targetIndex + 1, 0, {
                                id: generateRandomId(),
                                direction: 'row',
                                size: calcSize(size, 0.5),
                                children: newChildren
                            });
                        }
                        break;
                    case 'left':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.size = '50%';
                        targetPane.direction = 'column';
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.direction = 'column';
                            sourcePane.id = generateRandomId();
                            sourcePane.size = '50%';
                            targetParent.children.splice(targetIndex, 1, {
                                id: 'idabc',
                                direction: 'row',
                                size: size,
                                children: [
                                    sourcePane,
                                    targetPane
                                ]
                            });
                        } else { // 浮动窗口多个pane的情况
                            newChildren = sourcePane.children.map(item => {
                                let temp = {
                                    id: item.id,
                                    direction: item.direction,
                                    size: 50 * item.size.replace('%', '') / 100 + '%',
                                }
                                if (item.children) {
                                    temp.children = item.children;
                                }
                                if (item.type == 'pane') {
                                    temp.type = 'pane';
                                    temp.data = item.data;
                                }
                                return temp;
                            })
                            targetParent.children.splice(targetIndex, 1, {
                                id: 'idabc',
                                direction: 'row',
                                size: size,
                                children: [
                                    ...newChildren,
                                    targetPane
                                ]
                            });
                        }
                        break;
                    case 'center':
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        })
                        targetPane.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            }
        } else if (targetPane.direction == 'column') {
            if (sourcePane.direction == 'row') {
                switch (direction) {
                    case 'top':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.direction = 'row'
                        targetPane.size = '50%';
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        newChildren = sourcePane.children.map(item => {
                            let temp = {
                                id: item.id,
                                direction: item.direction,
                                size: 50 * item.size.replace('%', '') / 100 + '%',
                            }
                            if (item.children) {
                                temp.children = item.children;
                            }
                            if (item.type == 'pane') {
                                temp.type = 'pane';
                                temp.data = item.data;
                            }
                            return temp;
                        })
                        targetParent.children.splice(targetIndex, 1, {
                            id: generateRandomId(),
                            direction: 'column',
                            size: size,
                            children: [
                                ...newChildren,
                                targetPane
                            ]
                        })
                        break;
                    case 'right':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        size = targetPane.size.replace('%', '') / 2 + '%'
                        targetPane.size = size;
                        targetParent.children.splice(targetIndex + 1, 0, {
                            id: generateRandomId(),
                            direction: 'column',
                            size: size,
                            children: sourcePane.children
                        })
                        break;
                    case 'bottom':
                        clearFloat(sourcePane);
                        size = targetPane.size;
                        targetPane.direction = 'row'
                        targetPane.size = '50%';
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        newChildren = sourcePane.children.map(item => {
                            let temp = {
                                id: item.id,
                                direction: item.direction,
                                size: 50 * item.size.replace('%', '') / 100 + '%',
                            }
                            if (item.children) {
                                temp.children = item.children;
                            }
                            if (item.type == 'pane') {
                                temp.type = 'pane';
                                temp.data = item.data;
                            }
                            return temp;
                        })
                        targetParent.children.splice(targetIndex, 1, {
                            id: generateRandomId(),
                            direction: 'column',
                            size: size,
                            children: [
                                targetPane,
                                ...newChildren,
                            ]
                        })
                        break;
                    case 'left':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        size = targetPane.size.replace('%', '') / 2 + '%'
                        targetPane.size = size;
                        targetParent.children.splice(targetIndex, 0, {
                            id: generateRandomId(),
                            direction: 'column',
                            size: size,
                            children: sourcePane.children
                        })
                        break;
                    case 'center':
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        })
                        targetPane.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            } else if (sourcePane.direction == 'column') {
                switch (direction) {
                    case 'top':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        size = targetPane.size;
                        targetPane.direction = 'row';
                        targetPane.size = '50%';

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.id = generateRandomId();
                            sourcePane.direction = 'row';
                            sourcePane.size = '50%';
                            targetParent.children.splice(targetIndex, 1, {
                                id: generateRandomId(),
                                direction: 'column',
                                size: size,
                                children: [
                                    sourcePane,
                                    targetPane,
                                ]
                            })
                        } else { // 浮动窗口多个pane的情况
                            targetParent.children.splice(targetIndex, 1, {
                                id: generateRandomId(),
                                direction: 'column',
                                size: size,
                                children: [
                                    {
                                        id: generateRandomId(),
                                        direction: 'row',
                                        size: '50%',
                                        children: sourcePane.children
                                    },
                                    targetPane,
                                ]
                            })
                        }
                        break;
                    case 'right':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        targetPane.size = targetPane.size.replace('%', '') / 2 + '%';

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.id = generateRandomId();
                            sourcePane.direction = 'column';
                            sourcePane.size = targetPane.size;
                            targetParent.children.splice(targetIndex + 1, 0, sourcePane);
                        } else { // 浮动窗口多个pane的情况
                            newChildren = sourcePane.children.map(item => {
                                let temp = {
                                    id: item.id,
                                    direction: item.direction,
                                    size: targetPane.size.replace('%', '') * item.size.replace('%', '') / 100 + '%',
                                }
                                if (item.children) {
                                    temp.children = item.children;
                                }
                                if (item.type == 'pane') {
                                    temp.type = 'pane';
                                    temp.data = item.data;
                                }
                                return temp;
                            })
                            targetParent.children.splice(targetIndex + 1, 0, ...newChildren);
                        }
                        break;
                    case 'bottom':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        size = targetPane.size;
                        targetPane.direction = 'row';
                        targetPane.size = '50%';

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.id = generateRandomId();
                            sourcePane.direction = 'row';
                            sourcePane.size = '50%';
                            targetParent.children.splice(targetIndex, 1, {
                                id: generateRandomId(),
                                direction: 'column',
                                size: size,
                                children: [
                                    targetPane,
                                    sourcePane
                                ]
                            })
                        } else { // 浮动窗口多个pane的情况
                            targetParent.children.splice(targetIndex, 1, {
                                id: generateRandomId(),
                                direction: 'column',
                                size: size,
                                children: [
                                    targetPane,
                                    {
                                        id: generateRandomId(),
                                        direction: 'row',
                                        size: '50%',
                                        children: sourcePane.children
                                    }
                                ]
                            })
                        }
                        break;
                    case 'left':
                        clearFloat(sourcePane);
                        targetParent = getParentByChildId(targetId);
                        targetIndex = targetParent.children.indexOf(targetPane);
                        targetPane.size = targetPane.size.replace('%', '') / 2 + '%';

                        if (sourcePane.type == 'pane') { // 浮动窗口单个pane的情况
                            sourcePane.id = generateRandomId();
                            sourcePane.direction = 'column';
                            sourcePane.size = targetPane.size;
                            targetParent.children.splice(targetIndex, 0, sourcePane);
                        } else { // 浮动窗口多个pane的情况
                            newChildren = sourcePane.children.map(item => {
                                let temp = {
                                    id: item.id,
                                    direction: item.direction,
                                    size: targetPane.size.replace('%', '') * item.size.replace('%', '') / 100 + '%',
                                }
                                if (item.children) {
                                    temp.children = item.children;
                                }
                                if (item.type == 'pane') {
                                    temp.type = 'pane';
                                    temp.data = item.data;
                                }
                                return temp;
                            })
                            targetParent.children.splice(targetIndex, 0, ...newChildren);
                        }
                        break;
                    case 'center':
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        })
                        targetPane.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            }
        }

        if (sourcePane) {
            // 在floatPane中移除sourceId对应的pane
            let index = curLayoutData.value?.floatPane.indexOf(sourcePane);
            if (index !== -1) {
                curLayoutData.value?.floatPane.splice(index, 1);
            }
        }
    }

    /**
     * 将pane插入到浮动pane中
     * @param {*} sourceId 要插入的pane的id
     * @param {*} targetId 要插入的位置的pane的id
     * @param {*} direction 插入的方向
     */
    const insertPaneToFloat = (sourceId, targetId, direction) => {
        // 根据targetId找到插的位置
        const source = getFloatById(sourceId); // source就是root

        const targetFloatRootId = getFloatRoot(targetId);
        const targetFloatRoot = curLayoutData.value?.floatPane.find(item => item.id == targetFloatRootId);

        const sourceFloatRootIndex = curLayoutData.value?.floatPane.indexOf(source);

        const target = getFloatById(targetId);
        let targetParent = null;
        let targetFloatIndexInParent = -1;
        let size = 0;
        let newChildren = [];
        let style = {};
        
        // 实际上是将target再封装一层新的对象，target和source作为新对象的两个children，然后新对象替换到原来target在targetParent的children中的位置
        // 对比维度：direction、target的direction、source的direction
        // 这里source是取的floatRoot，target是取的具体的pane
        if (source.direction == 'column') {
            if (target.direction == 'column') {
                switch (direction) {
                    case 'top': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                style = target.style;
                                source.size = '50%';
                                target.size = '50%';
                                source.direction = 'row';
                                target.direction = 'row';
                                delete target.style;
                                delete source.style;
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'row',
                                    style: style,
                                    float: true,
                                    children: [
                                        source,
                                        target
                                    ]
                                });
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                source.id = generateRandomId();
                                size = target.size;
                                source.direction = 'row';
                                target.direction = 'row';
                                source.size = '50%';
                                target.size = '50%';
                                delete source.style;

                                targetParent.children.splice(targetFloatIndexInParent, 1, {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    float: true,
                                    size: size,
                                    children: [
                                        source,
                                        target
                                    ]
                                })
                            }
                        } else { // source为多个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.direction = 'row';
                                target.direction = 'row';
                                source.size = '50%';
                                target.size = '50%';
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                style = target.style;
                                delete target.style;
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'row',
                                    style: style,
                                    float: true,
                                    children: [
                                        source,
                                        target
                                    ]
                                })
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                target.direction = 'row';
                                size = target.size;
                                target.size = '50%';
                                targetParent.children.splice(targetFloatIndexInParent, 1, {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    float: true,
                                    size: size,
                                    children: [
                                        {
                                            id: generateRandomId(),
                                            direction: 'row',
                                            float: true,
                                            size: '50%',
                                            children: source.children
                                        },
                                        target
                                    ]
                                })
                            }
                        }
                        break;
                    case 'right': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                style = target.style;
                                delete target.style;
                                delete source.style;
                                source.size = '50%';
                                target.size = '50%';
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'column',
                                    style: style,
                                    float: true,
                                    children: [
                                        target,
                                        source
                                    ]
                                });
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                source.id = generateRandomId();
                                target.size = calcSize(target.size, 0.5);
                                source.size = target.size;
                                delete source.style;
                                targetParent.children.splice(targetFloatIndexInParent + 1, 0, source);
                            }
                        } else { // source为多个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                target.size = '50%';
                                source.children.forEach(item => {
                                    item.size = calcSize('50%', item.size);
                                })
                                style = target.style;
                                delete target.style;
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'column',
                                    style: style,
                                    float: true,
                                    children: [
                                        target,
                                        ...source.children
                                    ]
                                });
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                target.size = calcSize(target.size, '50%');
                                source.children.forEach(item => {
                                    item.size = calcSize(target.size, item.size);
                                })
                                targetParent.children.splice(targetFloatIndexInParent + 1, 0, ...source.children);
                            }
                        }
                        break;
                    case 'bottom': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                style = target.style;
                                source.size = '50%';
                                target.size = '50%';
                                source.direction = 'row';
                                target.direction = 'row';
                                delete target.style;
                                delete source.style;
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'row',
                                    style: style,
                                    float: true,
                                    children: [
                                        target,
                                        source
                                    ]
                                });
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                source.id = generateRandomId();
                                size = target.size;
                                source.direction = 'row';
                                target.direction = 'row';
                                source.size = '50%';
                                target.size = '50%';
                                delete source.style;

                                targetParent.children.splice(targetFloatIndexInParent, 1, {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    float: true,
                                    size: size,
                                    children: [
                                        target,
                                        source
                                    ]
                                })
                            }
                        } else { // source为多个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.direction = 'row';
                                target.direction = 'row';
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                source.size = '50%';
                                target.size = '50%';
                                style = target.style;
                                delete target.style;
                                delete source.style;
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'row',
                                    style: style,
                                    float: true,
                                    children: [
                                        target,
                                        source
                                    ]
                                })
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                target.direction = 'row';
                                size = target.size;
                                target.size = '50%';
                                targetParent.children.splice(targetFloatIndexInParent, 1, {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    float: true,
                                    size: size,
                                    children: [
                                        target,
                                        {
                                            id: generateRandomId(),
                                            direction: 'row',
                                            float: true,
                                            size: '50%',
                                            children: source.children
                                        }
                                    ]
                                })
                            }
                        }
                        break;
                    case 'left': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                style = target.style;
                                delete target.style;
                                delete source.style;
                                source.size = '50%';
                                target.size = '50%';
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'column',
                                    style: style,
                                    float: true,
                                    children: [
                                        source,
                                        target
                                    ]
                                });
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                source.id = generateRandomId();
                                target.size = calcSize(target.size, 0.5);
                                source.size = target.size;
                                delete source.style;
                                targetParent.children.splice(targetFloatIndexInParent, 0, source);
                            }
                        } else { // source为多个pane的情况
                            if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                                targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                                source.id = generateRandomId();
                                target.id = generateRandomId();
                                target.size = '50%';
                                source.children.forEach(item => {
                                    item.size = calcSize('50%', item.size);
                                })
                                style = target.style;
                                delete target.style;
                                curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                    id: targetId,
                                    direction: 'column',
                                    style: style,
                                    float: true,
                                    children: [
                                        ...source.children,
                                        target
                                    ]
                                });
                            } else { // target为多个pane的情况
                                targetParent = getFloatParentById(targetId);
                                targetFloatIndexInParent = targetParent.children.indexOf(target);
                                target.size = calcSize(target.size, '50%');
                                source.children.forEach(item => {
                                    item.size = calcSize(target.size, item.size);
                                })
                                targetParent.children.splice(targetFloatIndexInParent, 0, ...source.children);
                            }
                        }
                        break;
                    case 'center': // 完成
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        });
                        target.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            } else if (target.direction == 'row') {
                switch (direction) {
                    case 'top': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            source.id = generateRandomId()
                            delete source.style;
                            source.direction = 'row';
                            size = target.size.replace('%', '') / 2;
                            target.size = size + '%';
                            source.size = size + '%';
                            targetParent.children.splice(targetFloatIndexInParent, 0, source)
                        } else { // source为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size.replace('%', '') / 2;
                            target.size = size + '%';
                            targetParent.children.splice(targetFloatIndexInParent, 0, {
                                id: generateRandomId(),
                                direction: 'row',
                                float: true,
                                size: size + '%',
                                children: source.children
                            })
                        }
                        break;
                    case 'right': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size;
                            target.direction = 'column';
                            target.size = '50%';
                            source.direction = 'column';
                            source.id = generateRandomId();
                            source.size = '50%';
                            delete source.style;
                            targetParent.children.splice(targetFloatIndexInParent, 1, {
                                id: generateRandomId(),
                                direction: 'row',
                                float: true,
                                size: size,
                                children: [
                                    target,
                                    source
                                ]
                            });
                        } else { // source为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size;
                            target.size = '50%';
                            target.direction = 'column';
                            source.children.forEach(item => {
                                item.size = item.size.replace('%', '') * 50 / 100 + '%'
                            })
                            targetParent.children.splice(targetFloatIndexInParent, 1, {
                                id: generateRandomId(),
                                direction: 'row',
                                float: true,
                                size: size,
                                children: [
                                    target,
                                    ...source.children,
                                ]
                            });
                        }
                        break;
                    case 'bottom': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            source.id = generateRandomId()
                            delete source.style;
                            source.direction = 'row';
                            size = target.size.replace('%', '') / 2;
                            target.size = size + '%';
                            source.size = size + '%';
                            targetParent.children.splice(targetFloatIndexInParent + 1, 0, source)
                        } else { // source为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size.replace('%', '') / 2;
                            target.size = size + '%';
                            targetParent.children.splice(targetFloatIndexInParent + 1, 0, {
                                id: generateRandomId(),
                                direction: 'row',
                                float: true,
                                size: size + '%',
                                children: source.children
                            })
                        }
                        break;
                    case 'left': // 完成
                        if (source.type == 'pane') { // source为单个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size;
                            target.direction = 'column';
                            target.size = '50%';
                            source.direction = 'column';
                            source.id = generateRandomId();
                            source.size = '50%';
                            delete source.style;
                            targetParent.children.splice(targetFloatIndexInParent, 1, {
                                id: generateRandomId(),
                                direction: 'row',
                                float: true,
                                size: size,
                                children: [
                                    source,
                                    target
                                ]
                            });
                        } else { // source为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size;
                            target.size = '50%';
                            target.direction = 'column';
                            source.children.forEach(item => {
                                item.size = item.size.replace('%', '') * 50 / 100 + '%'
                            })
                            targetParent.children.splice(targetFloatIndexInParent, 1, {
                                id: generateRandomId(),
                                direction: 'row',
                                float: true,
                                size: size,
                                children: [
                                    ...source.children,
                                    target
                                ]
                            });
                        }

                        break;
                    case 'center': // 完成
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        })
                        target.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            }
        } else if (source.direction == 'row') { // source必然是多pane
            if (target.direction == 'column') {
                switch (direction) {
                    case 'top': // 完成
                        if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                            targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                            target.id = generateRandomId();
                            target.direction = 'row';
                            target.size = '50%';
                            source.children.forEach(item => {
                                item.size = item.size.replace('%', '') * 50 / 100 + '%'
                            })
                            // delete target.style;
                            delete source.style;
                            curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                id: targetId,
                                direction: 'row',
                                float: true,
                                size: '100%',
                                style: target.style,
                                children: [
                                    ...source.children,
                                    target
                                ]
                            });

                        } else { // target为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            target.direction = 'row';
                            delete source.style;
                            size = target.size;
                            target.size = '50%';
                            source.children.forEach(item => {
                                item.size = item.size.replace('%', '') * 50 / 100 + '%'
                            })
                            targetParent.children.splice(targetFloatIndexInParent, 1, {
                                id: generateRandomId(),
                                direction: 'column',
                                float: true,
                                size: size,
                                children: [
                                    ...source.children,
                                    target
                                ]
                            });
                        }
                        break;
                    case 'right': // 完成
                        if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                            targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                            target.id = generateRandomId();
                            style = target.style;
                            delete target.style;
                            size = target.size;
                            target.size = size.replace('%', '') / 2 + '%';
                            curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                id: targetId,
                                direction: 'column',
                                float: true,
                                style: style,
                                size: target.size,
                                children: [
                                    target,
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        float: true,
                                        size: target.size,
                                        children: source.children
                                    }
                                ]
                            })
                        } else { // target为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size;
                            target.size = size.replace('%', '') / 2 + '%';
                            targetParent.children.splice(targetFloatIndexInParent + 1, 0, {
                                id: generateRandomId(),
                                direction: 'column',
                                float: true,
                                size: target.size,
                                children: source.children
                            })
                        }
                        break;
                    case 'bottom': // 完成
                        if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                            targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                            target.id = generateRandomId();
                            target.direction = 'row';
                            target.size = '50%';
                            source.children.forEach(item => {
                                item.size = item.size.replace('%', '') * 50 / 100 + '%'
                            })
                            curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                id: targetId,
                                direction: 'row',
                                float: true,
                                size: '100%',
                                style: target.style,
                                children: [
                                    target,
                                    ...source.children
                                ]
                            });

                        } else { // target为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            target.direction = 'row';
                            size = target.size;
                            target.size = '50%';
                            source.children.forEach(item => {
                                item.size = item.size.replace('%', '') * 50 / 100 + '%'
                            })
                            targetParent.children.splice(targetFloatIndexInParent, 1, {
                                id: generateRandomId(),
                                direction: 'column',
                                float: true,
                                size: size,
                                children: [
                                    target,
                                    ...source.children
                                ]
                            });
                        }
                        break;
                    case 'left': // 完成
                        if (targetFloatRoot.type == 'pane') { // target为单个pane的情况
                            targetFloatIndexInParent = curLayoutData.value?.floatPane.indexOf(targetFloatRoot);
                            target.id = generateRandomId();
                            style = target.style;
                            delete target.style;
                            size = target.size;
                            target.size = size.replace('%', '') / 2 + '%';
                            curLayoutData.value?.floatPane.splice(targetFloatIndexInParent, 1, {
                                id: targetId,
                                direction: 'column',
                                float: true,
                                style: style,
                                size: target.size,
                                children: [
                                    {
                                        id: generateRandomId(),
                                        direction: 'column',
                                        float: true,
                                        size: target.size,
                                        children: source.children
                                    },
                                    target
                                ]
                            })
                        } else { // target为多个pane的情况
                            targetParent = getFloatParentById(targetId);
                            targetFloatIndexInParent = targetParent.children.indexOf(target);
                            size = target.size;
                            target.size = size.replace('%', '') / 2 + '%';
                            targetParent.children.splice(targetFloatIndexInParent, 0, {
                                id: generateRandomId(),
                                direction: 'column',
                                float: true,
                                size: target.size,
                                children: source.children
                            })
                        }
                        break;
                    case 'center': // 完成
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        })
                        target.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            } else if (target.direction == 'row') { // target必然是多pane
                targetParent = getFloatParentById(targetId);
                targetFloatIndexInParent = targetParent.children.indexOf(target);
                switch (direction) {
                    case 'top':
                        size = target.size;
                        target.size = size.replace('%', '') / 2 + '%';
                        source.children.forEach(item => {
                            item.size = item.size.replace('%', '') * target.size.replace('%', '') / 100 + '%'
                        })
                        targetParent.children.splice(targetFloatIndexInParent, 0, ...source.children);
                        break;
                    case 'right':
                        size = target.size;
                        target.direction = 'column';
                        target.size = '50%';
                        targetParent.children.splice(targetFloatIndexInParent, 1, {
                            id: generateRandomId(),
                            direction: 'row',
                            float: true,
                            size: size,
                            children: [
                                target,
                                {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    float: true,
                                    size: '50%',
                                    children: source.children
                                }
                            ]
                        })
                        break;
                    case 'bottom':
                        size = target.size;
                        target.size = size.replace('%', '') / 2 + '%';
                        source.children.forEach(item => {
                            item.size = item.size.replace('%', '') * target.size.replace('%', '') / 100 + '%'
                        })
                        targetParent.children.splice(targetFloatIndexInParent + 1, 0, ...source.children);
                        break;
                    case 'left':
                        size = target.size;
                        target.direction = 'column';
                        target.size = '50%';
                        targetParent.children.splice(targetFloatIndexInParent, 1, {
                            id: generateRandomId(),
                            direction: 'row',
                            float: true,
                            size: size,
                            children: [
                                {
                                    id: generateRandomId(),
                                    direction: 'column',
                                    float: true,
                                    size: '50%',
                                    children: source.children
                                },
                                target
                            ]
                        })
                        break;
                    case 'center':
                        const paneArr = getAllPaneInFloat(sourceId);
                        let tabArr = [];
                        paneArr.forEach(item => {
                            if (item.type == 'pane') {
                                tabArr.push(...item.data.group);
                            }
                        })
                        target.data.group.push(...tabArr);
                        break;
                    default:
                        break;
                }
            }
        }
        curLayoutData.value?.floatPane.splice(sourceFloatRootIndex, 1);
    }

    /**
     * 根据paneName切换pane的打开状态
     * @param {*} paneName
     */
    const togglePaneOpen = (paneName) => {
        const isOpen = isPaneOpend(paneName);
        if (isOpen) {
            let pane = null;
            pane = getByPaneName(paneName);
            if (pane && pane.data) { // 固定面板的关闭
                if (pane.data.group.length == 1) { // 直接删除固定面板
                    closePane(pane.id);
                } else {
                    let index = pane.data.group.indexOf(paneName);
                    pane.data.group.splice(index, 1);
                    if (pane.data.active == paneName) {
                        pane.data.active = pane.data.group[0];
                    }
                }
            } else {
                pane = getFloatByPaneName(paneName);
                if (pane && pane.data) { // 浮动面板的关闭
                    if (pane.id.startsWith(floatPaneIdPrefix.value)) {
                        if (pane.data.group.length == 1) { // 直接删除整个浮动面板
                            closeFloatPane(pane.id);
                        } else {
                            let index = pane.data.group.indexOf(paneName);
                            pane.data.group.splice(index, 1);
                            if (pane.data.active == paneName) {
                                pane.data.active = pane.data.group[0];
                            }
                        }
                    } else {
                        const parent = getFloatParentById(pane.id);
                        if (!parent) {
                            return;
                        }
                        parent.children.splice(parent.children.indexOf(pane), 1);

                        if (parent.children.length == 1) {
                            parent.type = parent.children[0].type;
                            parent.data = parent.children[0].data;
                            parent.direction = 'column';
                            delete parent.children;
                        }
                    }
                } else {
                    // 判断是否为autoHide
                    pane = getAutoHideByPaneName(paneName);
                    if (pane && pane.data) {
                        if (pane.group.length == 1) { // 直接删除整个浮动面板
                            closeAutoHidePane(pane.group[0].id);
                        } else {
                            let index = pane.group.findIndex(item => item.comp == paneName);
                            pane.group.splice(index, 1);
                        }
                    }
                }
            }
        } else {// 打开pane
            insertPane(null, 'root', 'left', paneName);
        }
    }

    const setWindowLayoutByFilter = (fullData, unKnowArr) => {
        const getWindowByTab = (id) => {
            if (!id) return;
            let result = null;
            function findWndow(node) {
                if (node && node.tab && node.tab.some(item => item.id == id)) {
                    result = node;
                } else if (node && node.children && node.children.length) {
                    node.children.forEach(child => {
                        findWndow(child);
                    })
                }
            }
            findWndow(fullData.data);
            return result;
        }

        const getParentWindowByChildId = (childId) => {
            let parent = null;
            const findParent = (node) => {
                if (node && node.children && node.children.length) {
                    if (node.children.some(child => child.id == childId)) {
                        parent = node;
                    } else {
                        node.children.forEach(child => {
                            findParent(child);
                        })
                    }
                }

            }
            findParent(fullData.data);
            return parent;
        }

        const getWindowById = (id) => {
            if (!id) {
                return;
            }
            let result = null;
            function findWindow(node) {
                if (node.id == id) {
                    result = node;
                } else if (node.children && node.children.length) {
                    node.children.forEach(child => {
                        findWindow(child);
                    })
                }
            }
            findWindow(fullData.data);
            return result;
        }

        const closeWindow = (id, tab) => {
            if (!id) {
                return;
            }
            let window = getWindowById(id);
            if (!window) {
                return;
            }
            if (window.active == window.tab.indexOf(tab) || window.active >= window.tab.length) {
                if (window.tab.length > 1) {
                    window.active = 0;
                }
            }
            window.tab.splice(window.tab.indexOf(tab), 1);
            if (!window.tab.length) {
                if (id == windowRootId.value) {
                    fullData.data = null;
                    fullData.active = '';
                    fullData.maximize = ''
                } else {
                    window.active = 0;

                    updateParent(id);
                    function updateParent(id) {
                        if (!id) {
                            return;
                        }
                        let curWindow = getWindowById(id);
                        if (id == windowRootId.value) {
                            fullData.data = null;
                            fullData.active = '';
                            fullData.maximize = ''
                        } else {
                            const parent = getParentWindowByChildId(id);
                            if (!parent) return;
                            parent.children.forEach(item => { // window的宽度平均分给其他兄弟节点
                                if (item.id !== id && item.size) {
                                    item.size = calcSize(item.size, 100 / curWindow.size.replace('%', ''));
                                }
                            })
                            parent.children.splice(parent.children.indexOf(curWindow), 1);

                            if (parent.children.length == 0) {
                                updateParent(parent.id);
                            }
                        }
                    }
                }
            }

            if (fullData.active == tab.id) {
                if (window.tab.length) {
                    fullData.active = window.tab[0].id;
                } else {
                    const tabs = getAllWindowTab();
                    if (tabs.length) {
                        fullData.active = tabs[0].id;
                    }
                }
            }
        }

        unKnowArr.forEach(item => {
            const w = getWindowByTab(item);
            const tab = w.tab.find(i => i.id == item);
            closeWindow(w.id, tab);
        })

        windowLayout.value = fullData;
    }

    //#endregion

    const updateBaseData = () => {
        const rootCompEl = document.getElementById('root');
        mainWidth.value = rootCompEl.offsetWidth;
        mainHeight.value = rootCompEl.offsetHeight;
        defaultWidthPercent.value = defaultWidth.value / mainWidth.value * 100 + '%';
        if (!layoutDataBeforeSelectProject.children[0].size) {
            layoutDataBeforeSelectProject.children[0].size = defaultWidthPercent.value;
        }
        if (layoutData.value && !layoutData.value.children[0].size) {
            layoutData.value.children[0].size = defaultWidthPercent.value;
        }
    }

    const resetLayout = () => {
        if (!layoutData.value) {
            console.warn('The default layout is not set');
            return;
        }
        
        setCurAutoHideActive('');
        curLayoutData.value = JSON.parse(JSON.stringify(layoutData.value));
        emitter.emit('layoutChange', {
            type: 'resetLayout'
        })
    }
    
    const getCurrentActivePane = () => {
        if (!curActive.value) {
            return null;
        }
        
        const pane = getById(curActive.value);
        if (!pane) {
            return null
        } else {
            return pane.data?.active || null;
        }
    }

    const toggleWindowActive = (id) => {
        if (!id) return;
        const getWindowByTab = (id) => {
            if (!id) return;
            let result = null;
            function findWndow(node) {
                if (node && node.tab && node.tab.some(item => item.id == id)) {
                    result = node;
                } else if (node && node.children && node.children.length) {
                    node.children.forEach(child => {
                        findWndow(child);
                    })
                }
            }
            findWndow(windowLayout.value.data);
            return result;
        }

        const w = getWindowByTab(id);
        if (!w) return;

        w.active = w.tab.findIndex(i => i.id == id);
        windowLayout.value.active = id;
    }

    return {
        updateBaseData,
        clearMenu,
        isPaneOpend,
        updatePaneSize,
        getParentByChildId,
        getById,
        getFloatById,
        defaultProjectId,
        layoutDataBeforeSelectProject,
        curLayoutData,
        layoutData,
        curDragId,
        spliterGap,
        defaultWidth,
        defaultHeight,
        curActive,
        setCurActive,
        setCurActiveByRootId,
        curAutoHideActive,
        setCurAutoHideActive,
        closeAutoHidePane,
        updateAutoHideSize,
        floatDockResize,
        hasSibling,
        getIndexInSibling,
        setTabFloat,
        setFloatTabFloat,
        setPaneFloat,
        unSetPaneFloat,
        unSetRootPaneFloat,
        setFloatPaneToNewFloat,
        setFloatPanePosition,
        insertPane,
        insertPaneToFloat,
        toggleActive,
        generateRandomId,
        setPanePin,
        setPaneUnpin,
        floatPaneIdPrefix,
        isChildPane,
        getFloatRoot,
        getAllPaneInFloat,
        indicatorHover,
        setIndicatorHover,
        indicatorInFloat,
        tabSort,
        closePane,
        closeTabInPane,
        closeFloatPane,
        transferDefaultWidthToPercent,
        togglePaneOpen,
        openWindowByName,
        windowLayout,
        setWindowLayout,
        copyWindow,
        updateWindowSize,
        closeWindow,
        getAllWindowTab,
        getAdjacentWindow,
        tabMoveToNext,
        tabMoveToPrevious,
        closeAllWindow,
        closeAllOtherWindow,
        newHorizontalTab,
        newVerticalTab,
        dragWindowTab,
        dropTab,
        toggleWindowActive,

        windowTabList,
        paneTabList,

        setWindowLayoutByFilter,

        resetLayout,

        getCurrentActivePane,
        closeWindowByTabId,
        toggleWindowDisplay,
    }
}