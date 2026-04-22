const RequiredHint = (required: boolean) => {
  return required ? (
    <span className="text-accentRed">*</span>
  ) : (
    <span className="text-[#6B6B6B]">(Optional)</span>
  );
};

export default RequiredHint;
