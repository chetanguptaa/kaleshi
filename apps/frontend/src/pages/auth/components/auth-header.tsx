import Logo from "../../../components/header/logo";

export default function AuthHeader() {
  return (
    <header className="border-b bg-white">
      <div className="px-4 md:px-6 py-4  w-[90%] mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
          </div>
        </div>
      </div>
      <div className="border-t" />
    </header>
  );
}
