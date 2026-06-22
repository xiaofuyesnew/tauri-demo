export type NumberPairString = `${string}_${string}`;

export interface TableItem {
    id: string | number,
    coord_e: string | number,
    coord_n: string | number,
    z: string | number,
    md: string | number,
    incl: string | number,
    closure_azimuth: string | number,
    disp_e: string | number,
    disp_n: string | number,
    tvd: string | number,
    dls: string | number,
    editStatus?: string, // 原始数据并且未更改时为undefined，可编辑数据有空或者不满足校验规则时为error，其他修改的数据为edit
    mdStatus?: string, // 用于判断md数据是否合规，为空表示md列正常，error表示md列数据异常
    sort_base_id?: string | number, // 新增行的基准id
    sort_offset?: number, // 新增行的偏移量
    _X_ROW_KEY?: string, // vxeTable给的行key
    originalData?: Object, // 原始数据
}

/**
 * md列数据的判断逻辑
 * 1.正数
 * 2.当前md，向上查找到第一个正常数据prevMd，md > prevMd；如果不存在prevMd，并且md为正数，则md为正常数据
 */

export interface MdStatusItem {
    targetIndex: number | string,
    status: string,
}
