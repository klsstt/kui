import { beforeEach, describe, expect, it } from 'vitest'
import { Dropdown } from '../../packages/core/src/components/dropdown/dropdown'

/**
 * 下拉菜单行为契约。
 * 这些用例锁住「点击触发器开合」与「点击菜单项后收起」两条关键交互。
 */

function mountDropdown(): { trigger: HTMLElement; menu: HTMLElement; instance: Dropdown } {
    document.body.innerHTML = `
<div class="dropdown">
    <button type="button" data-kui-toggle="dropdown" aria-haspopup="true" aria-expanded="false">操作</button>
    <ul class="dropdown-menu" role="menu">
        <li><a class="dropdown-item" href="javascript:void(0)">编辑</a></li>
        <li><a class="dropdown-item" href="javascript:void(0)">删除</a></li>
    </ul>
</div>
`
    const trigger = document.querySelector<HTMLElement>('[data-kui-toggle="dropdown"]')!
    const menu = document.querySelector<HTMLElement>('.dropdown-menu')!
    return { trigger, menu, instance: Dropdown.getOrCreate(trigger) }
}

describe('Dropdown', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('点击触发器会展开菜单', () => {
        const { trigger, menu, instance } = mountDropdown()
        expect(instance.isShown()).toBe(false)

        trigger.click()
        expect(instance.isShown()).toBe(true)
        expect(menu.classList.contains('show')).toBe(true)
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
    })

    it('再次点击触发器会收起菜单', () => {
        const { trigger, instance } = mountDropdown()
        trigger.click()
        trigger.click()
        expect(instance.isShown()).toBe(false)
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('点击菜单项后自动收起', () => {
        const { trigger, menu, instance } = mountDropdown()
        trigger.click()
        menu.querySelector<HTMLElement>('.dropdown-item')!.click()
        expect(instance.isShown()).toBe(false)
    })

    it('点击页面空白处会收起菜单', () => {
        const { trigger, instance } = mountDropdown()
        trigger.click()
        document.body.click()
        expect(instance.isShown()).toBe(false)
    })

    it('销毁后不再持有监听', () => {
        const { trigger, instance } = mountDropdown()
        instance.dispose()
        trigger.click()
        expect(instance.isShown()).toBe(false)
    })
})
