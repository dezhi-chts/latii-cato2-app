import { Modal } from "antd";
import React, { useEffect } from "react";
import { Image, Spin, notification } from "antd";
import { getEvidenceByFileId } from "@/services/evidenceService";
const EvidenceModal = ({ 
    showEvideceModal, 
    setShowEvideceModal,
    projectId,
    fileId,
    evidenceIds, 
}: any) => {
    const [loading, setLoading] = React.useState<boolean>(false);
    const [filterEvidences, setFilterEvidences] = React.useState<any>([]);

    useEffect(() => {
        getFileEvidences();
    }, []);
    //获取item中evidence
    const getFileEvidences = async () => {
        setLoading(true);
        const response = await getEvidenceByFileId(projectId, fileId);
        //const response = await getEvidencesByProjectId(projectId);
        if (response.status === "success") {
            let filterList = response?.data.filter((item: any) => {
                //console.log('##########  item.id =' + item.id +  ' evidences = ' + JSON.stringify(evidenceIds) );
                return evidenceIds.includes(item.id)
            });
            // let list = response.data;
            // for(let i = 0; i < 5; i++){
            //     list = list.concat(response.data);
            // }
            setFilterEvidences(filterList);
        } else {
            notification.error({
                message: "Error",
                description: "Failed to get evidences",
            })
        }
        setLoading(false);
    }
    return (
        <Modal
            title={null}
            open={showEvideceModal}
            footer={null}
            width={'60%'}
            //className="transparent-modal"
            onCancel={() => {
                setShowEvideceModal(false);
            }}
        >
            <div className="w-[100%] h-[60vh] overflow-y-auto relative">
                <div className="flex h-full flex-row flex-wrap gap-4">
                    {
                        filterEvidences.map((item: any) => {
                            return (
                                <div key={item.id} className="w-[30%] h-[300px] bg-[#f5f5f5] rounded-[10px] flex items-center justify-center overflow-hidden">
                                    <Image 
                                        src={item.evidence_url}  
                                        alt=""
                                        preview={true}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    
                                </div>
                            )
                        })
                    }
                </div>
                {
                    loading && 
                    <Spin  
                        spinning={loading}
                        className="absolute left-0 top-0 w-full h-full flex items-center justify-center"
                    ></Spin>
                }
            </div>
        </Modal>
    )
}

export default EvidenceModal;
