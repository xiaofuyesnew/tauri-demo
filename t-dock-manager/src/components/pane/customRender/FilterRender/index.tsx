import { VxeUI } from 'vxe-table';
import FilterRender from './index.vue';

function matchCondition(cellValue, condition, num) {
    let result = true
    switch (condition) {
        case '':
            result = true;
            break;
        case '==':
            result = cellValue == num;
            break;
        case '<':
            result = cellValue < num;
            break;
        case '<=':
            result = cellValue <= num;
            break;
        case '>':
            result = cellValue > num;
            break;
        case '>=':
            result = cellValue >= num;
            break;
        case 'U':
            // TODO
            result = true;
            break;
        default:
            result = true;
            break;
    }

    return result;
}

VxeUI.renderer.add('FilterRender', {
    // 筛选模板
    renderTableFilter(renderOpts, renderParams) {
        return <FilterRender key={ renderParams.column.field } render-params={ renderParams } />
    },
    showFilterFooter: false,
    // 筛选方法
    tableFilterMethod(params) {
        const { row, column } = params;
        const cellValue = row[column.field];

        if (column.filters[0]) {
            const filter = params.column.filters[0];
            const filterCondition = filter.value;
            const flag1 = filterCondition.condition1 && filterCondition.num1 != null;
            const flag2 = filterCondition.condition2 && filterCondition.num2 != null;
            const logical = filterCondition.logical;
            if (flag1 && flag2) {
                if (logical == 1) {
                    return matchCondition(cellValue, filterCondition.condition1, filterCondition.num1)
                        && matchCondition(cellValue, filterCondition.condition2, filterCondition.num2);
                } else if (logical == 2) {
                    return matchCondition(cellValue, filterCondition.condition1, filterCondition.num1)
                        || matchCondition(cellValue, filterCondition.condition2, filterCondition.num2);
                }
            } else if (flag1) {
                return matchCondition(cellValue, filterCondition.condition1, filterCondition.num1)
            } else if (flag2) {
                return matchCondition(cellValue, filterCondition.condition2, filterCondition.num2)
            }
        }

        return true;
    }
})