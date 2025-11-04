import http from "@/lib/http";

export interface IDrawingTemplateData {
    file: any;
    product: number;
    product_type: number;
    operability?: string;
    code: string;
    comment?: string;
    data_structure: string;
    template_type: string;
    id?:number;
}

export const drawingService = {

    addDrawingTemplate(data: IDrawingTemplateData): Promise<any> {
        return http.post(`/drawing/`, data)
            .then(res => res.data);
    },

    updateDrawingTemplate(data: IDrawingTemplateData, id: any): Promise<any> {
        return http.put(`/drawing/${id}`, data)
            .then(res => res.data);
    },

    loadTemplateData(templateType?: string, product_type?:any, params?:any, ): Promise<any> {
        let url = `/drawing/?template_type=${templateType}`
        if(product_type){
            url = `${url}&product_type=${product_type}`
        }
        if(params?.product){
            url += `&product=${params.product}`
        }
        if(params?.operability){
            url += `&operability=${params.operability}`
        }
        if(params?.shape) {
            url += `&shape=${params.shape}`
        }
        return http.get(url)
            .then(res => res.data);
    },

    getTemplateDetailById(drawingId: string): Promise<any> {
        return http.get(`/drawing/${drawingId}`)
            .then(res => res.data);
    },

    removeTemplateById(drawingId: string): Promise<any> {
        return http.delete(`/drawing/${drawingId}`)
            .then(res => res.data);
    },

    getTemplateType(): Promise<any> {
        return http.get(`/drawing/template_type/all`)
            .then(res =>  res.data.filter(item => !item.key.includes('_half')));
    }


};