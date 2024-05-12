import { query, update, text, Record, StableBTreeMap, Vec, Ok, Err, Canister } from "azle";
import { sha256 } from "sha256";

const Interaction = Record({
    id: text,
    date: text,
    interaction_type: text,
    description: text,
    status: text,
    comments: text
});

const Purchase = Record({
    id: text,
    date: text,
    product: text,
    quantity: nat64, // Assuming quantity is a number
    price: nat64, // Assuming price is a number
});

const Customer = Record({
    id: text,
    name: text,
    company: text,
    email: text,
    phone: text,
    interactions: Vec(Interaction),
    purchases: Vec(Purchase)
});

const CustomerPayload = Record({
    name: text,
    company: text,
    email: text,
    phone: text,
});

const InteractionPayload = Record({
    date: text,
    interaction_type: text,
    description: text,
    status: text,
    comments: text
});

const PurchasePayload = Record({
    date: text,
    product: text,
    quantity: text,
    price: text,
});

const Message = Record({
    NotFound: text,
    InvalidPayload: text,
});

const customerStorage = StableBTreeMap(0, text, Customer);
const interactionStorage = StableBTreeMap(1, text, Interaction);
const purchaseStorage = StableBTreeMap(2, text, Purchase);

export default Canister({
    getCustomers: query([], Vec(Customer), () => {
        return customerStorage.values();
    }),

    getCustomer: query([text], Result(Customer, Message), (id) => {
        const customerOpt = customerStorage.get(id);
        if (customerOpt === null) {
            return Err({ NotFound: `Customer with id=${id} not found` });
        }
        return Ok(customerOpt);
    }),

    addCustomer: update([CustomerPayload], Result(Customer, Message), (payload) => {
        if (!payload || Object.keys(payload).length === 0) {
            return Err({ InvalidPayload: "Invalid payload" });
        }
        const id = sha256(payload.email); // Generating ID using SHA256 of email
        const customer = { id, ...payload, interactions: [], purchases: [] };
        customerStorage.insert(id, customer);
        return Ok(customer);
    }),

    updateCustomer: update([Customer], Result(Customer, Message), (payload) => {
        const existingCustomer = customerStorage.get(payload.id);
        if (existingCustomer === null) {
            return Err({ NotFound: `Customer with id=${payload.id} not found` });
        }
        customerStorage.insert(payload.id, payload);
        return Ok(payload);
    }),

    deleteCustomer: update([text], Result(text, Message), (id) => {
        const deletedCustomer = customerStorage.remove(id);
        if (deletedCustomer === null) {
            return Err({ NotFound: `Customer with id=${id} not found` });
        }
        return Ok(id);
    }),

    addInteraction: update([text, InteractionPayload], Result(text, Message), (customerId, payload) => {
        if (!payload || Object.keys(payload).length === 0) {
            return Err({ InvalidPayload: "Invalid payload" });
        }
        const interaction = { id: sha256(payload.description), ...payload };
        const customer = customerStorage.get(customerId);
        if (customer === null) {
            return Err({ NotFound: `Customer with id=${customerId} not found` });
        }
        customer.interactions.push(interaction);
        customerStorage.insert(customerId, customer);
        interactionStorage.insert(interaction.id, interaction);
        return Ok(interaction.id);
    }),

    // Other functions follow the same pattern...

});

// Define nat64 type for compatibility
type nat64 = bigint;
