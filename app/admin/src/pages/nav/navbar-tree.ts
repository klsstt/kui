export function initNavbarTree(host: HTMLElement): () => void {
    const tree = host.querySelector<HTMLElement>('[data-nav-tree]')
    const sidebar = host.querySelector<HTMLElement>('[data-nav-sidebar]')
    const toggle = host.querySelector<HTMLButtonElement>('[data-nav-sidebar-toggle]')
    if (!tree || !sidebar || !toggle) return () => {}

    const controller = new AbortController()
    const { signal } = controller
    const branches = Array.from(tree.querySelectorAll<HTMLButtonElement>('[data-nav-tree-branch]'))
    const links = Array.from(tree.querySelectorAll<HTMLButtonElement>('[data-nav-tree-link]'))

    const setCollapsed = (collapsed: boolean): void => {
        if (collapsed && sidebar.contains(document.activeElement)) toggle.focus()
        host.classList.toggle('is-collapsed', collapsed)
        toggle.setAttribute('aria-expanded', String(!collapsed))
        toggle.setAttribute('aria-label', collapsed ? '展开侧栏' : '收起侧栏')
        toggle.title = collapsed ? '展开侧栏' : '收起侧栏'
        const icon = toggle.querySelector('i')
        icon?.classList.toggle('fa-angle-double-left', !collapsed)
        icon?.classList.toggle('fa-angle-double-right', collapsed)
        branches.forEach((branch) => {
            const expanded = !collapsed && Boolean(branch.closest('li')?.classList.contains('open'))
            branch.setAttribute('aria-expanded', String(expanded))
            const panel = branch.nextElementSibling
            if (panel instanceof HTMLElement) panel.hidden = !expanded
        })
    }

    const syncCurrentGroup = (): void => {
        branches.forEach((branch) => {
            const group = branch.closest('li')
            group?.classList.toggle('has-current', Boolean(group.querySelector('[aria-current="page"]')))
        })
    }

    toggle.addEventListener('click', () => setCollapsed(!host.classList.contains('is-collapsed')), { signal })
    sidebar.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || host.classList.contains('is-collapsed')) return
        event.preventDefault()
        setCollapsed(true)
        toggle.focus()
    }, { signal })

    branches.forEach((branch) => {
        branch.addEventListener('click', () => {
            const group = branch.closest('li')
            if (!group) return
            if (host.classList.contains('is-collapsed')) group.classList.add('open')
            else group.classList.toggle('open')
            const panel = branch.nextElementSibling
            if (!group.classList.contains('open') && panel?.contains(document.activeElement)) branch.focus()
            setCollapsed(false)
        }, { signal })
    })

    links.forEach((link) => {
        link.addEventListener('click', () => {
            links.forEach((item) => {
                item.classList.remove('is-active')
                item.removeAttribute('aria-current')
            })
            link.classList.add('is-active')
            link.setAttribute('aria-current', 'page')
            const title = host.querySelector<HTMLElement>('[data-nav-tree-title]')
            const note = host.querySelector<HTMLElement>('[data-nav-tree-note]')
            if (title) title.textContent = link.getAttribute('aria-label') ?? link.textContent?.trim() ?? ''
            if (note) note.textContent = link.dataset.navTreeSummary ?? ''
            syncCurrentGroup()
        }, { signal })
    })

    syncCurrentGroup()
    setCollapsed(host.classList.contains('is-collapsed'))
    return () => controller.abort()
}
