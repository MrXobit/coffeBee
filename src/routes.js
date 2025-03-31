import Admin from "./components/admin/Admin";
import FormAddSub from "./components/cafePass/formAddSub/FormAddSub";
import FormEdit from "./components/cafePass/formEdit/FormEdit";
import Login from "./components/login/Login";
import ResetPasword from "./components/resetPasword/ResetPasword";
import Signup from "./components/signup/Signup";
import UpdatePasword from "./components/updatePasword/UpdatePasword";
import ChooseAccount from "./components/сhooseAccount/ChooseAccount";
import AddBeans from "./components/beans/AddBeans";
import RoasteryDetails from "./components/roasters/roasteryDetails/RoasteryDetails";

export const authRoutes = [
    {
        path: '/admin',
        element: <Admin/>
    },
    {
        path: '/chooseAccount',
        element: <ChooseAccount/>
    },
    {
        path: '*',
        element: <Admin/>
    },
    {
        path: '/addSubscription',
        element: <FormAddSub/>
    },
    {
        path: '/editSubscription',
        element: <FormEdit/>
    },
    {
        path: '/add-coffee-bean',
        element: <AddBeans/>
    },

    {
        path: '/roaster/:id',
        element: <RoasteryDetails/>
    }
];

export const publicRoutes = [
    {
        path: '/login',
        element: <Login/>
    },

    {
        path: '/sign-up',
        element: <Signup/>
    },
    {
        path: '*',
        element: <Login/>
    },
    {
        path: '/reset-password',
        element: <ResetPasword/>
    },
    {
        path: '/update-password',
        element: <UpdatePasword/>
    }
];
