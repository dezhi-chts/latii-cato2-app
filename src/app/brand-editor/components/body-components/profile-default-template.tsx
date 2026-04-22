"use client";

import { useState, useEffect } from "react";
import { Tree, Button, Space, Modal, Form, Select, Input, message, Tooltip, notification, Image as AntdImage } from "antd";
import { FileOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, SaveOutlined, LeftOutlined, SearchOutlined } from "@ant-design/icons";
import {
	fetchProductTypesLibrary,
	fetchOperabilityLibrary
} from "@/services/productBaseEditorService";

const ProfileDefaultTemplate = (props: any) => {

	const [productTypesLibrary, setProductTypesLibrary] = useState([]);
	const [operabilityLibrary, setOperabilityLibrary] = useState([]);
	const [productTypesLibrarySearchWord, setProductTypesLibrarySearchWord] = useState("");
	const [operabilityLibrarySearchWord, setOperabilityLibrarySearchWord] = useState("");

	useEffect(() => {
		initAllData()
	}, []);

	const initAllData = async () => {
		getProductTypesLibrary()
		getOperabilityLibrary()
	};

	const getProductTypesLibrary = async () => {
		const res = await fetchProductTypesLibrary();
		if (res.status == "success") {
			const list = (res?.data || []).map((item: any) => ({
				...item,
				isShow: true,
			}));
			setProductTypesLibrary(list || [])
		}
	};

	const getOperabilityLibrary = async () => {
		const res = await fetchOperabilityLibrary();
		if (res.status == "success") {
			const list = (res?.data || []).map((item: any) => ({
				...item,
				isShow: true,
			}));
			setOperabilityLibrary(list || [])
		}
	};

	const changeProductTypesLibrarySearchWordAndAlreadyExistence = (e: any) => {
		let keyword = ""
		if (e) {
			const value = e?.target?.value
			setProductTypesLibrarySearchWord(value)
			keyword = value.toLowerCase();
		} else {
			keyword = productTypesLibrarySearchWord.toLowerCase();
		}
		productTypesLibrary.forEach((item: any) => {
			item.isShow = false;

			if (
				item.product_type_name &&
				item.product_type_name.toLowerCase().includes(keyword)
			) {
				item.isShow = true;
			}
		});
		setProductTypesLibrary([...productTypesLibrary])
	};

	const changeOperabilityLibrarySearchWordAndAlreadyExistence = (e: any) => {
		let keyword = ""
		if (e) {
			const value = e?.target?.value
			setOperabilityLibrarySearchWord(value)
			keyword = value.toLowerCase();
		} else {
			keyword = operabilityLibrarySearchWord.toLowerCase();
		}

		operabilityLibrary.forEach((item: any) => {
			item.isShow = false;

			if (
				item.name &&
				item.name.toLowerCase().includes(keyword)
			) {
				item.isShow = true;
			}
		});
		setOperabilityLibrary([...operabilityLibrary])
	};

	return (
		<div className="bg-white h-full text-[14px]">
			<div
				className="inline-flex items-center mb-2 cursor-pointer"
				style={{ color: "#014767" }}
				onClick={props.handleBackParameter}
			>
				<LeftOutlined style={{ fontSize: "16px" }} />
				<h4 className="ml-2">Back</h4>
			</div>
			<div className="flex flex-nowrap h-[calc(100%-30px)]">
				<div className="flex flex-col w-[400px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5 justify-between">
						<div>Types</div>
					</div>
					<div className='flex-1 p-4 pl-5 pr-5' style={{ height: "calc(100% - 40px)" }}>
						<div className='h-[50%] overflow-y-auto min-h-0'>

						</div>
						<div className='text-[12px] pt-2 h-[50%] min-h-0'>
							<div className='text-[#717171]'>Options</div>
							<div className='mt-2 mb-2'>
								<Input
									placeholder="Single Swing, Hopper"
									prefix={<SearchOutlined className='text-[#DCDCDC]' />}
									value={productTypesLibrarySearchWord}
									onChange={changeProductTypesLibrarySearchWordAndAlreadyExistence}
								/>
							</div>
							<div style={{ height: "calc(100% - 50px)" }} className='overflow-y-auto'>
								{
									productTypesLibrary.map((item: any) => {
										return (
											item.isShow
												? <div
													key={item.product_type_code}
													className='flex p-2 border-b border-b-[#EBEDF0] items-center cursor-pointer'
												>
													<AntdImage
														src={item.file_url}
														width={35}
														style={{ borderRadius: "6px" }}
														preview={{
															mask: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px' }}><EyeOutlined /></div>,
														}}
													>

													</AntdImage>
													<Tooltip placement="right" title={'Click to add'}>
														<div className='ml-2 flex-1'>
															<div>{item.product_type_name}</div>
															<div style={{ fontSize: "10px" }} className='text-[#717171]'>{item.product_name}</div>
														</div>
													</Tooltip>
												</div>
												: null
										)
									})
								}
							</div>
						</div>
					</div>
				</div>
				<div className="flex flex-col w-[400px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5">
						<div>Opens</div>
					</div>
					<div className='p-4 pl-5 pr-5' style={{ height: "calc(100% - 40px)" }}>
						<div className='h-[50%] overflow-y-auto min-h-0'>

						</div>
						<div className='text-[12px] pt-2 h-[50%] min-h-0'>
							<div className='text-[#717171]'>Options</div>
							<div className='mt-2 mb-2'>
								<Input
									placeholder="Please input"
									prefix={<SearchOutlined className='text-[#DCDCDC]' />}
									value={operabilityLibrarySearchWord}
									onChange={changeOperabilityLibrarySearchWordAndAlreadyExistence}
								/>
							</div>
							<div style={{ height: "calc(100% - 50px)" }} className='overflow-y-auto'>
								{
									operabilityLibrary.map((item: any) => {
										return (
											item.isShow
												? <div
													key={item.code}
													className='flex p-2 border-b border-b-[#EBEDF0] items-center cursor-pointer'
												>
													<AntdImage
														src={item.file_url}
														width={35}
														style={{ borderRadius: "6px" }}
														preview={{
															mask: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px' }}><EyeOutlined /></div>,
														}}
													>

													</AntdImage>
													<Tooltip placement="right" title={'Click to add'}>
														<div className='ml-2 flex-1'>
															<div>{item.name}</div>
														</div>
													</Tooltip>

												</div>
												: null
										)
									})
								}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfileDefaultTemplate;
