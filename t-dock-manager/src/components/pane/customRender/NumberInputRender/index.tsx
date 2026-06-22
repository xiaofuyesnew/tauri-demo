import { VxeUI } from 'vxe-table';
import NumberInputRender from './index.vue';

VxeUI.renderer.add('NumberInputRender', {
    tableAutoFocus: 'input',
    tableHeaderCellAlign: 'left',
    tableCellAlign: 'left',
    renderTableEdit: (renderOpts, renderParams) => {
        let { events } = renderOpts;
        
        return <NumberInputRender renderParams={ renderParams } onValuechange={ events.valuechange } />;
    },
    renderTableCell: (renderOpts, renderParams) => {
        const { row, column } = renderParams;
        return <span>{ row[column.field] }</span>;
    }
})