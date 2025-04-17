import { ContractType } from "../lib/db/models/enums"

export default function ContractName({
  contractType,
}: {
  contractType: ContractType
}) {
  return {
    [ContractType.FT]: "Fungible token",
    [ContractType.NFT]: "Non-fungible token",
    [ContractType.RXD]: "RXD",
    [ContractType.CONTAINER]: "Container",
    [ContractType.USER]: "User",
    [ContractType.DELEGATE_BURN]: "Delegate burn",
    [ContractType.DELEGATE_TOKEN]: "Delegate token",
  }[contractType]
}
