export type FormFieldValue  = string | File

export interface FormField {
    name: string;
    value: FormFieldValue;
    type?: string;
    required?: boolean
}

export interface AjaxSubmitOptions {
    beforeSerialize?: (form: HTMLFormElement, options: AjaxSubmitOptions) => boolean | void
    beforeSubmit?: (fields: FormField[], form: HTMLFormElement, options: AjaxSubmitOptions) => boolean | void
    clearForm?: boolean
    data?: Record<string, FormFieldValue | FormFieldValue[]>
    error?: (error: unknown) => void
    fetcher?: typeof fetch
    headers?: HeadersInit
    includeHidden?: boolean | string
    method?: string
    resetForm?: boolean
    semantic?: boolean
    success?: (data: unknown, response: Response) => void
    target?: Element | string
    type?: string
    url?: string
}

export function formToArray(form: HTMLFormElement, semantic=false): FormField[]{
    const elements = getFormControls(form)
    const fields: FormField[] = []
    for(const element of elements){
        const name = element.name
        if(!name || element.disabled){
            continue;
        }

        if(element instanceof HTMLInputElement && element.type === 'file'){
            const files = Array.from(element.files ?? [])
            if(!files.length){
                fields.push({name, value: '',type: element.type, required: element.required})
            }else{
                files.forEach((file)=> files.push({name, value: file, type:element.type,required: element.required}))
            }
            continue
        }

        const value = fieldValue(element, true)
        if(value === null || typeof value === 'undefined'){
            continue;
        }

        const values = Array.isArray(value) ? value: [value]
        values.forEach((item) => {
            fields.push({name,value:item,type:getControlType(element),required:isRequired(element) })
        })
    }

    if(!semantic){
        return fields
    }

    return fields
}

export function formSerialize(form: HTMLFormElement, semantic= false): string {
    return fieldsToSearchParams(formToArray(form,semantic)).toString()
}

export function fieldValue(control: FormControl, successful = true): string|string[]|null{
    const name = control.name
    const type = getControlType(control)
    const tag = control.tagName.toLowerCase()

    if(
        successful &&
        (!name ||
            control.disabled ||
            type === 'reset' ||
            type === 'button' ||
            ((type === 'checkbox' || type === 'radio')&& control instanceof HTMLInputElement && !control.checked) ||
            ((type === 'submit' || type === 'image') && control instanceof HTMLInputElement) ||
            (tag === 'select' && control instanceof HTMLSelectElement && control.selectedIndex === -1))
    ){
        return null
    }

    if(control instanceof HTMLSelectElement) {
        const selected = Array.from(control.options).filter((option)=> option.selected)
        if(control.type === 'select-one'){
            return selected[0]?.value??null
        }
        return selected.map((option)=>option.value)
    }

    if(control instanceof HTMLTextAreaElement || control instanceof HTMLInputElement){
        return control.value
    }

    return null
}

export function fieldSerialize(controls: Iterable<FormControl>, successful = true): string {
    const fields: FormField[] = []
    for (const control of controls) {
        const value = fieldValue(control,successful)
        if(value === null || typeof value === 'undefined'){
            continue
        }

        const values  = Array.isArray(value)?value:[value]
        values.forEach((item) => fields.push({name: control.name, value:item}))
    }
    return fieldsToSearchParams(fields).toString()
}

export function clearForm(form: HTMLFormElement, includeHidden:boolean|string =false):void {
    clearFields(getFormControls(form),includeHidden)
}

export function clearFields(controls: Iterable<FormControl>, includeHidden: boolean|string=false): void {
    for(const control of controls){
        const type = getControlType(control)
        if(control instanceof HTMLInputElement) {
            if(/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i.test(type)){
                control.value = ''
            }else if(type === 'checkbox' || type === 'radio'){
                control.checked = false
            }else if(type === 'file'){
                control.value = ''
                control.files = null
            }else if(type === 'hidden' && shouldClearHidden(control, includeHidden)) {
                control.value = ''
            }
        } else if(control instanceof HTMLTextAreaElement){
            control.value = ''
        } else if(control instanceof HTMLSelectElement){
            control.selectedIndex = -1
        }
    }
}

export function resetForm(form: HTMLFormElement): void {
    form.reset()
}

export async function ajaxSubmit(form: HTMLFormElement, options: AjaxSubmitOptions = {}): Promise<Response> {
    if(options.beforeSerialize?.(form,options)===false){
        throw new Error('ajax submit aborted by before serialize')
    }

    const fields = formToArray(form, options.semantic)
    if(options.beforeSubmit?.(fields, form, options) === false){
        throw new Error('ajax submit aborted by before submit')
    }

    const method = (options.type ?? options.method ?? form.method ?? 'GET').toUpperCase()
    const action = options.url ?? form.getAttribute('action') ?? window.location.href
    const url = new URL(action || window.location.href, window.location.href)
    appendExtraData(fields,options.data)
    const init: RequestInit = {method, headers:options.headers}
    const params = fieldsToSearchParams(fields)
    if(method==='GET'){
        params.forEach((value,key)=> url.searchParams.append(key,value))
    } else {
        init.body = params
        init.headers = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            ...normalizeHeaders(options.headers),
        }
    }

    try{
        const response = await (options.fetcher ?? fetch)(url.toString(), init)
        const data = await response.clone().text()
        updateTarget(options.target,data)
        if(options.resetForm){
            resetForm(form)
        }
        if(options.clearForm){
            clearForm(form,options.includeHidden)
        }
        options.success?.(data,response)
        return response
    }catch(error){
        options.error?.(error)
        throw error
    }
}

export function ajaxForm(form: HTMLFormElement, options: AjaxSubmitOptions = {}):() => void {
    const onSubmit = (event:SubmitEvent) => {
        event.preventDefault()
        void ajaxSubmit(form,options)
    }
    form.addEventListener('submit', onSubmit)
    return () => form.removeEventListener('submit',onSubmit)
}

type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

function getFormControls(form: HTMLFormElement): FormControl[] {
    const controls = Array.from(form.elements).filter(isFormControl)
    if(form.id){
        document.querySelectorAll(`[form="${escapeSelector(form.id)}"]`).forEach((element) => {
            if(isFormControl(element) && !controls.includes(element)){
                controls.push(element)
            }
        })
    }
    return controls
}

function isFormControl(element: Element): element is FormControl {
    return (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
    )
}

function getControlType(control:FormControl):string {
    return control.type.toLowerCase()
}

function isRequired(control: FormControl): boolean{
    return 'required' in control ? control.required:false
}

function fieldsToSearchParams(fields:FormField[]): URLSearchParams{
    const params = new URLSearchParams()
    fields.forEach((field) => {
        if(!(field.value instanceof File)){
            params.append(field.name,field.value)
        }
    })

    return params
}

function appendExtraData(fields:FormField[], data?: AjaxSubmitOptions['data']): void {
    Object.entries(data ?? {}).forEach(([name,value])=>{
        const values = Array.isArray(value)?value:[value]
        values.forEach((item) => fields.push({name,value:item}))
    })
}

function shouldClearHidden(control: HTMLInputElement, includeHidden: boolean|string):boolean{
    return includeHidden === true || (typeof includeHidden === 'string' && control.matches(includeHidden))
}

function updateTarget(target: AjaxSubmitOptions['target'],html: string): void {
    if(!target){
        return;
    }
    const element = typeof target=== 'string' ? document.querySelector(target):target
    if(element instanceof HTMLElement){
        element.innerHTML = html
    }
}


function normalizeHeaders(headers: HeadersInit|undefined): Record<string,string> {
    if(!headers){
        return {}
    }
    if(headers instanceof Headers){
        return Object.fromEntries(headers.entries())
    }
    if(Array.isArray(headers)){
        return Object.fromEntries(headers)
    }
    return headers
}

function escapeSelector(value: string): string {
    return typeof CSS !== 'undefined' ? typeof CSS.escape === 'function'
    ? CSS.escape(value) : value.replace(/"/g, '\\"')
}
