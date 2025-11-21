import PlainNavbar from "../../components/Navbar/PlainNavbar";
import LandingPageCard from "../../components/Card/LandingPageCard";
import RightsReservedFooter from "../../components/Footer/RightsReservedFooter";
import { Typewriter } from "react-simple-typewriter";

function LandingPage() {
  return (
    <>
      <PlainNavbar/>
      <div className="container px-3">

        {/* Hero Section */}
        <div className="row my-5 align-items-center">

          {/* Left Text Section */}
          <div className="col-md-8 d-none d-md-block">
            <h1 className="display-4 fw-bold" style={{ color: "#fff" }}>
              <Typewriter
                words={["Welcome to CodeRoom!"]}
                loop={1}
                cursor
                cursorStyle="|"
                typeSpeed={50}
                delaySpeed={1000}
              />
            </h1>

            <p className="lead mt-3" style={{ color: "#cbd5e1" }}>
              Platform for colleges to simplify the entire workflow of coding assignments
            </p>
          </div>

        </div>

        {/* Cards Row */}
        <div className="row mt-4">
          <div className="col-12 col-md-6 my-3">
            <LandingPageCard
              title="CodeRoom for Students"
              content="Solve coding assignments with a clean interface and instant feedback."
              btntext="Login as Student"
              btnlink="/studentlogin"
            />
          </div>

          <div className="col-12 col-md-6 my-3">
            <LandingPageCard
              title="CodeRoom for Professors"
              content="Create questions  and evaluate submissions easily."
              btntext="Login as Professor"
              btnlink="/professorlogin"
            />
          </div>
        </div>

        {/* Register Card */}
        <div className="row my-1">
          <div className="col-12">
            <LandingPageCard
              title="Register Your College"
              content="Get your college onboard with CodeRoom and automate coding workflows."
              btntext="Register"
              btnlink="/registercollege"
            />
          </div>
        </div>

      </div>

      <RightsReservedFooter />
    </>
  );
}

export default LandingPage;
