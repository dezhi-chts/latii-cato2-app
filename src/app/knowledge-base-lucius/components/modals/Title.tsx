const Title = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-forumBlue-normal">{title}</p>
      <p className="text-xs font-light">{subtitle}</p>
    </div>
  );
};

export default Title;
