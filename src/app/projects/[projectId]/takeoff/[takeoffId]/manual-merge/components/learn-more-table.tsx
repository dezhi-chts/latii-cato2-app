"use client";

const LearnMoreTable = () => {
  const items = [
    {
      label: "asd",
      sublabel: "asd1",
      type: "door",
      open: "swing",
    },
    {
      label: "asd",
      sublabel: "asd1",
      type: "door",
      open: "swing",
    },
    {
      label: "asd",
      sublabel: "asd1",
      type: "door",
      open: "swing",
    },
    {
      label: "asd",
      sublabel: "asd1",
      type: "door",
      open: "swing",
    },
  ];
  return (
    <div className="w-[33vw]">
      {/*  titulo */}
      <div className="flex justify-between items-center pb-4">
        <p>Reading File 1</p>{" "}
        {/* Aca van los nombres o Final Table para la final */}
        <div className="text-xs py-2 px-2 rounded-md flex items-center justify-center text-teal-dark-active bg-cyan-light-active ">
          <span> Base</span>
        </div>
        {/* Solo el primero */}
      </div>
      {/* encabezados */}
      <div className="text-grey-normal bg-grey-light flex rounded-t-md ">
        <div className="w-2/12 flex justify-center items-center py-3 font-semibold">
          Label
        </div>
        <div className="w-2/12 flex justify-center items-center py-3 font-semibold">
          Sub-Label
        </div>
        <div className="w-3/12 flex justify-center items-center py-3 font-semibold">
          Type
        </div>
        <div className="w-5/12 flex justify-center items-center py-3 font-semibold">
          Open
        </div>
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex border-b border-r border-l border-primaryN30 "
        >
          {/*  Falta agregar estilos condicionales para el texto cuando sepamos como detectar cuales son los que cambian */}{" "}
          <div className="w-2/12 flex justify-center items-center py-3 border-r border-primaryN30 ">
            {item.label}
          </div>
          <div className="w-2/12 flex justify-center items-center py-3 border-r border-primaryN30">
            {item.sublabel}
          </div>
          <div className="w-3/12 flex justify-center items-center py-3 border-r border-primaryN30">
            {item.type}
          </div>
          <div className="w-5/12 flex justify-center items-center py-3 ">
            {item.open}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LearnMoreTable;
