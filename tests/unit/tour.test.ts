import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Tour } from '../../packages/core/src/components/tour/tour'

/**
 * 引导行为契约。
 * 引导会向 body 追加浮层，因此每个用例结束后必须显式释放。
 */

function mount(onFinish = vi.fn()) {
    document.body.innerHTML = '<button id="tour-target">目标</button><div id="tour-source"></div>'
    const source = document.querySelector<HTMLElement>('#tour-source')!
    const tour = Tour.getOrCreate(source, {
        steps: [
            { title: '第一步', content: '说明一', target: '#tour-target' },
            { title: '第二步', content: '说明二', target: '#tour-target' },
        ],
        onFinish,
    })
    return { tour, onFinish }
}

describe('Tour', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('start 后渲染遮罩与气泡', () => {
        const { tour } = mount()
        tour.start()
        expect(document.querySelector('.kui-tour__mask')).not.toBeNull()
        expect(document.querySelector('.kui-tour__bubble')).not.toBeNull()
        expect(document.querySelector('.kui-tour__title')?.textContent).toBe('第一步')
        tour.dispose()
    })

    it('next 推进到最后一步后 finish', () => {
        const { tour, onFinish } = mount()
        tour.start()
        tour.next()
        expect(document.querySelector('.kui-tour__counter')?.textContent).toBe('2 / 2')
        tour.next()
        expect(onFinish).toHaveBeenCalledTimes(1)
        expect(document.querySelector('.kui-tour')).toBeNull()
    })

    it('Esc 关闭并回调 close 原因', () => {
        const onClose = vi.fn()
        document.body.innerHTML = '<div id="source"></div>'
        const tour = Tour.getOrCreate(document.querySelector<HTMLElement>('#source')!, {
            steps: [{ title: '仅一步', content: '说明' }],
            onClose,
        })
        tour.start()
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        expect(onClose).toHaveBeenCalledWith('escape')
        expect(tour.isOpen).toBe(false)
        tour.dispose()
    })

    it('dispose 会移除浮层并停止监听', () => {
        const { tour } = mount()
        tour.start()
        tour.dispose()
        expect(document.querySelector('.kui-tour')).toBeNull()
        expect(document.body.querySelector('.kui-tour__mask')).toBeNull()
    })
})
