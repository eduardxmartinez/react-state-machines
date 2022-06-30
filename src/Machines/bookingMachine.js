import { assign, createMachine } from "xstate";
import { fetchCountries } from "../Utils/api";

const fillCountries = {
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        id: "getCountries",
        src: () => fetchCountries,
        onDone: {
          target: "success",
          actions: assign({
            countries: (context, event) => event.data
          })
        },
        onError: {
          target: "failure",
          actions: assign({
            error: "Falló el request"
          })
        }
      }
    },
    success: {},
    failure: {
      on: {
        RETRY: { target: 'loading' }
      }
    }
  }
}

const bookingMachine = createMachine({
  id: "buy plane tickets",
  initial: "initial",
  context: {
    selectedCountry: "",
    countries: [],
    passengers: [],
    error: ""
  },
  states: {
    initial: {
      on: {
        START: {
          target: "search",
          actions: "cancelar"
        },
      },
    },
    search: {
      on: {
        CONTINUE: {
          target: "passengers",
          actions: assign({
            selectedCountry: (context, event) => event.selectedCountry
          })
        },
        CANCEL: {
          target:"initial",
          actions: "cancelar"
        },
      },
      ...fillCountries,
    },
    tickets: {
      after: {
        5000:{
          target: "initial",
          actions: "cancelar",
        },
      },
      on: {
        FINISH: "initial",
      },
    },
    passengers: {
      on: {
        DONE: {
          target: "tickets",
          cond: "existingPassenger",
        },
        CANCEL: {
          target: "initial",
          actions: "cancelar"
        },
        ADD: {
          target: "passengers",
          actions: assign(
            (context,event) => context.passengers.push(event.newPassenger),
          )
        }
      },
    },
  }, 
},
{
  actions: {
    cancelar: assign({
      selectedCountry: '',
      passengers: [],
      countries: []
    })
  },
  guards: {
    existingPassenger: (context) => {
      return context.passengers.length > 0;
    }
  }
}
);

export default bookingMachine;