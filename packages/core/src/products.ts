import { literal } from './lib'

/*
 * This file contains information about the various SpaceMouse devices
 */

export const VENDOR_IDS = [0x46d, 0x256f]

export interface Product {
	/** Name / Identifier of the device */
	name: string
	vendorId: number
	productId: number
}


export const PRODUCTS: { [name: string]: Product } = {
    "SpaceNavigator": literal<Product>({
        name: "SpaceNavigator",
        vendorId: 0x46d,
        productId: 0xc626
    }),
    "SpaceMouse_Wireless": literal<Product>({
        name: "SpaceMouse Wireless",
        vendorId: 0x256f,
        productId: 0xc62e
    }),
    "SpaceMouse_Wireless_2": literal<Product>({
        name: "SpaceMouse Wireless",
        vendorId: 0x256f,
        productId: 0xc63a
    }),
    "SpaceNavigator_for_Notebooks": literal<Product>({
        name: "SpaceNavigator for Notebooks",
        vendorId: 0x46d,
        productId: 0xc628
    }),
    "SpaceMouse_Compact": literal<Product>({
        name: "SpaceMouse Compact",
        vendorId: 0x256f,
        productId: 0xc635
    }),
    "SpaceMouse_Module": literal<Product>({
        name: "SpaceMouse Module",
        vendorId: 0x256f,
        productId: 0xc636
    }),
    "SpaceMouse_Pro": literal<Product>({
        name: "SpaceMouse Pro",
        vendorId: 0x46d,
        productId: 0xc62b
    }),
    "SpaceMouse_Pro_Wireless": literal<Product>({
        name: "SpaceMouse Pro Wireless",
        vendorId: 0x256f,
        productId: 0xc631
    }),
    "SpaceMouse_Pro_Wireless_2": literal<Product>({
        name: "SpaceMouse Pro Wireless",
        vendorId: 0x256f,
        productId: 0xc638
    }),
    "LIPARI": literal<Product>({
        name: "LIPARI",
        vendorId: 0x256f,
        productId: 0xc62c
    }),
    "SpacePilot_PRO": literal<Product>({
        name: "SpacePilot PRO",
        vendorId: 0x46d,
        productId: 0xc629
    }),
    "SpaceMouse_Enterprise": literal<Product>({
        name: "SpaceMouse Enterprise",
        vendorId: 0x256f,
        productId: 0xc633

    }),
    "CadMouse": literal<Product>({
        name: "CadMouse",
        vendorId: 0x256f,
        productId: 0xc650
    }),
    "CadMouse_Wireless": literal<Product>({
        name: "CadMouse Wireless",
        vendorId: 0x256f,
        productId: 0xc651
    }),
    "CadMouse_Pro_Wireless": literal<Product>({
        name: "CadMouse Pro Wireless",
        vendorId: 0x256f,
        productId: 0xc654
    }),
    "CadMouse_Compact": literal<Product>({
        name: "CadMouse Compact",
        vendorId: 0x256f,
        productId: 0xc655
    }),
    "CadMouse_Pro": literal<Product>({
        name: "CadMouse Pro",
        vendorId: 0x256f,
        productId: 0xc656
    }),
    "CadMouse_Pro_Wireless_Left": literal<Product>({
        name: "CadMouse Pro Wireless Left",
        vendorId: 0x256f,
        productId: 0xc657
    }),
    "CadMouse_Compact_Wireless": literal<Product>({
        name: "CadMouse Compact Wireless",
        vendorId: 0x256f,
        productId: 0xc658
    }),
    "Cassini": literal<Product>({
        name: "Cassini",
        vendorId: 0x256f,
        productId: 0xc659

    }),
    "Keyboard_Pro": literal<Product>({
        name: "Keyboard Pro",
        vendorId: 0x256f,
        productId: 0xc664
    }),
    "Numpad_Pro": literal<Product>({
        name: "Numpad Pro",
        vendorId: 0x256f,
        productId: 0xc665
    }),
    "Keyboard_Pro_2": literal<Product>({
        name: "Keyboard Pro",
        vendorId: 0x256f,
        productId: 0xc668
    }),
    "SpaceMouse_Wireless_Receiver": literal<Product>({
        name: "SpaceMouse Wireless Receiver",
        vendorId: 0x256f,
        productId: 0xc62f
    }),
    "SpaceMouse_Pro_Wireless_Receiver": literal<Product>({
        name: "SpaceMouse Pro Wireless Receiver",
        vendorId: 0x256f,
        productId: 0xc632
    }),
    "Universal_Receiver": literal<Product>({
        name: "Universal Receiver",
        vendorId: 0x256f,
        productId: 0xc652
    }),
    "Universal_Receiver_2": literal<Product>({
        name: "Universal Receiver 2",
        vendorId: 0x256f,
        productId: 0xc65a
    }),
    "Universal_Receiver_2_2": literal<Product>({
        name: "Universal Receiver 2",
        vendorId: 0x256f,
        productId: 0xc65c
    })
}

