import { defineComponent, h, ref } from 'vue'

export default defineComponent({
  name: 'ElPopover',
  setup(_props, { expose, slots }) {
    const visible = ref(false)

    function hide() {
      visible.value = false
    }

    function toggle() {
      visible.value = !visible.value
    }

    expose({ hide })

    return () => h('span', { class: 'simple-popover' }, [
      h('span', { class: 'simple-popover-reference', onClick: toggle }, slots.reference?.()),
      visible.value
        ? h('span', { class: 'simple-popover-content' }, slots.default?.())
        : null,
    ])
  },
})
