"use client";

import { useState, useEffect } from "react";
import {
	fetchCompanyByKeycloakUser
} from "@/services/companyService";
import {
	fetchProductAttributeVersionByAttributeNameCompanyId,
	fetchUnitAttributesWithOptionsByVersionId
} from "@/services/profileEditorService";


const LibraryOption = () => {

	const [companyMsg, setCompanyMsg] = useState<Record<string, any>>({});
	const [unitMsg, setUnitMsg] = useState<Record<string, any>>({});

	useEffect(() => {
		initData()
	}, []);

	const initData = async () => {
		const companyRes = await fetchCompanyByKeycloakUser();
		if (companyRes.status == "success") {
			setCompanyMsg(companyRes?.data)
			const [
				unitVersion
			] = await Promise.all([
				fetchProductAttributeVersionByAttributeNameCompanyId(
					"UNIT Attribute Tree",
					companyRes?.data.id
				)
			]);
			if (unitVersion?.status == "success" && Array.isArray(unitVersion?.data) && unitVersion?.data.length != 0) {
				const [
					unitAttributesWithOptions
				] = await Promise.all([
					fetchUnitAttributesWithOptionsByVersionId(unitVersion?.data[0]?.id)
				]);
				setUnitMsg(unitAttributesWithOptions?.data);
			}
		}
	};

	return (
		<div>
			Option
		</div>
	);
};

export default LibraryOption;
